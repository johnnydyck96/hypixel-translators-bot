import Discord from "discord.js"
import { client, Command } from "../../index"
import { db } from "../../lib/dbclient"
import { PunishmentLog, updateModlogFields } from "../../lib/util"

const command: Command = {
	name: "case",
	description: "Gives you information about any given case.",
	options: [{
		type: "INTEGER",
		name: "case",
		description: "Case number",
		required: true
	}],
	roleWhitelist: ["768435276191891456"], //Discord Staff
	async execute(interaction) {
		const caseNumber = interaction.options.getInteger("case", true),
			modLog = await db.collection("punishments").findOne({ case: caseNumber }) as PunishmentLog | undefined
		if (!modLog) throw `Couldn't find that case number! You must enter a number between 1 and ${await db.collection("punishments").estimatedDocumentCount()}`

		const offender = interaction.guild!.members.cache.get(modLog.id) ?? await client.users.fetch(modLog.id),
			embed = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor("Punishment case")
				.setTitle(`Here's case #${caseNumber}`)
				.setDescription(`Offender: ${offender instanceof Discord.GuildMember ? offender : offender.tag}`)
				.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
		updateModlogFields(embed, modLog)
		await interaction.reply({ embeds: [embed] })
	}
}

export default command