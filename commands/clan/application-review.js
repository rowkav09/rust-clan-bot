'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');
const embeds = require('../../utils/embeds');
const time = require('../../utils/time');
const { requireTier, TIER, getConfig } = require('../../utils/permissions');

async function finalizeApplication(interaction, decision, client) {
  if (!(await requireTier(interaction, TIER.OFFICER))) return;

  const appId = interaction.customId.split(':')[1];
  const apps = db.read('applications');
  const app = apps[appId];

  if (!app) {
    return interaction.reply({
      embeds: [embeds.error('Not found', 'That application no longer exists.')],
      ephemeral: true,
    });
  }
  if (app.status !== 'pending') {
    return interaction.reply({
      embeds: [embeds.info('Already reviewed', `This application was already **${app.status}**.`)],
      ephemeral: true,
    });
  }

  app.status = decision === 'accept' ? 'approved' : 'denied';
  app.reviewedBy = interaction.user.id;
  db.write('applications', apps);

  // Update the original review message embed + remove buttons.
  try {
    const original = interaction.message;
    const updated = EmbedBuilder.from(original.embeds[0])
      .setColor(decision === 'accept' ? embeds.COLORS.success : embeds.COLORS.error);
    const fields = updated.data.fields || [];
    const statusIdx = fields.findIndex((f) => f.name === 'Status');
    const statusText = decision === 'accept' ? '✅ Approved' : '❌ Denied';
    if (statusIdx >= 0) fields[statusIdx].value = `${statusText} by <@${interaction.user.id}>`;
    updated.setFields(fields);
    await interaction.update({ embeds: [updated], components: [] });
  } catch (err) {
    console.error('[application-review] Could not edit message:', err.message);
  }

  // Assign the recruit role on acceptance.
  let roleNote = '';
  if (decision === 'accept') {
    const cfg = getConfig();
    if (cfg.recruitRoleId) {
      try {
        const guild = interaction.guild;
        const member = await guild.members.fetch(app.userId);
        await member.roles.add(cfg.recruitRoleId);
      } catch (err) {
        roleNote = '\n⚠️ Could not assign the recruit role (check role hierarchy / permissions).';
        console.error('[application-review] Role assign failed:', err.message);
      }
    }
  }

  // DM the applicant.
  try {
    const user = await client.users.fetch(app.userId);
    const dm =
      decision === 'accept'
        ? embeds.success(
            'Application Approved! 🎉',
            'Welcome to the clan! You’ve been given the **Recruit** role. ' +
              'Use `/checkin` when you go in-game and `/help` to see what you can do.',
          )
        : embeds.error(
            'Application Denied',
            'Thanks for applying. Unfortunately your application was not successful this time. ' +
              'You’re welcome to apply again in the future.',
          );
    await user.send({ embeds: [dm] });
  } catch {
    roleNote += '\n*(Could not DM the applicant — their DMs are closed.)*';
  }

  if (roleNote) {
    await interaction.followUp({
      embeds: [embeds.warning('Heads up', roleNote.trim())],
      ephemeral: true,
    });
  }

  // If this was handled in a ticket thread, archive + lock it.
  try {
    if (interaction.channel?.isThread?.()) {
      await interaction.channel.send({
        embeds: [embeds.info('Ticket closed', `Decision: **${app.status}** by <@${interaction.user.id}>.`)],
      });
      await interaction.channel.setLocked(true).catch(() => {});
      await interaction.channel.setArchived(true).catch(() => {});
    }
  } catch { /* ignore */ }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('application-review')
    .setDescription('Review clan applications (Officer+).')
    .addStringOption((o) =>
      o.setName('app_id').setDescription('A specific application ID (omit to list pending).'),
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER.OFFICER))) return;

    const apps = db.read('applications');
    const appId = interaction.options.getString('app_id');

    if (appId) {
      const app = apps[appId];
      if (!app) {
        return interaction.reply({
          embeds: [embeds.error('Not found', `No application with ID \`${appId}\`.`)],
          ephemeral: true,
        });
      }
      const embed = embeds
        .info(`Application — ${app.username}`)
        .addFields(
          { name: 'Applicant', value: `<@${app.userId}>`, inline: true },
          { name: 'Status', value: app.status, inline: true },
          { name: 'Submitted', value: time.relative(app.submittedAt), inline: true },
          { name: 'Age', value: app.age, inline: true },
          { name: 'Rust Hours', value: app.rustHours, inline: true },
          { name: 'Previous Clans', value: app.previousClans || 'None' },
          { name: 'Availability', value: app.availability },
          { name: 'Why Join', value: app.whyJoin },
        )
        .setFooter({ text: `Application ID: ${app.id}` });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const pending = Object.values(apps).filter((a) => a.status === 'pending');
    if (pending.length === 0) {
      return interaction.reply({
        embeds: [embeds.info('No pending applications', 'The queue is empty. 🎉')],
        ephemeral: true,
      });
    }
    const list = pending
      .map((a) => `• \`${a.id}\` — <@${a.userId}> · submitted ${time.relative(a.submittedAt)}`)
      .join('\n');
    return interaction.reply({
      embeds: [embeds.info(`Pending Applications (${pending.length})`, list)],
      ephemeral: true,
    });
  },

  buttons: {
    async app_accept(interaction, args, client) {
      return finalizeApplication(interaction, 'accept', client);
    },
    async app_deny(interaction, args, client) {
      return finalizeApplication(interaction, 'deny', client);
    },
  },
};
