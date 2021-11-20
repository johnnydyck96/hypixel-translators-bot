const fs = require("node:fs")
const axios = require("axios")
const { flag, code, name, countries } = require("country-emoji")
const country = require("countryjs")
const { loadingColor, errorColor, successColor, neutralColor, listeningStatuses, watchingStatuses, playingStatuses, ids } = require("../../config.json")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { leveling } = require("../../lib/leveling")
const { updateButtonColors, getUUID, updateRoles, getXpNeeded } = require("../../lib/util")
const { generateWelcomeImage } = require("../../listeners/guildMemberAdd")
import { inspect } from "node:util"
import discord from "discord.js"
import { transpile, getParsedCommandLineOfConfigFile, sys } from "typescript"
import { db as mongoDb } from "../../lib/dbclient"
import { generateTip as randomTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "eval",
	description: "Evals the specified code.",
	roleWhitelist: [ids.roles.star],
	options: [{
		type: "STRING",
		name: "code",
		description: "The code to run",
		required: true
	}],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		const me = interaction.member,
			guild = interaction.guild!,
			channel = interaction.channel,
			db = mongoDb,
			Discord = discord,
			client = interaction.client,
			generateTip = randomTip

		await interaction.deferReply({ ephemeral: interaction.channelId !== ids.channels.botDev })
		let evaled,
			codeToRun = interaction.options.getString("code", true).replaceAll(/[“”]/gim, '"')
		if (codeToRun.includes("await ")) codeToRun = `(async () => {\n${codeToRun}\n})()`

		// this is stupid - https://github.com/microsoft/TypeScript/issues/45856
		const options = getParsedCommandLineOfConfigFile(
			"tsconfig.json",
			{},
			{
				...sys,
				onUnRecoverableConfigFileDiagnostic: console.error
			})!.options
		options.sourceMap = false
		options.alwaysStrict = false

		const compiledCode = transpile(codeToRun, options)
		try {
			evaled = await eval(compiledCode)
			const inspected = inspect(evaled, { depth: 1, getters: true }),
				embed = new discord.MessageEmbed()
					.setColor(successColor)
					.setAuthor("Evaluation")
					.setTitle("The code was executed successfully! Here's the output")
					.addFields(
						{ name: "Input", value: discord.Formatters.codeBlock("ts", codeToRun.substring(0, 1015)) },
						{ name: "Compiled code", value: discord.Formatters.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1015)) },
						{ name: "Output", value: discord.Formatters.codeBlock("js", inspected.substring(0, 1015)) },

						{
							name: "Output type",
							value:
								evaled?.constructor.name === "Array"
									? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>`
									: evaled?.constructor.name ?? typeof evaled,
							inline: true
						},
						{ name: "Output length", value: `${inspected.length}`, inline: true },
						{ name: "Time taken", value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, inline: true }
					)
					.setFooter(generateTip(), me.displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.editReply({ embeds: [embed] })
			console.log(evaled)
		} catch (error) {
			const embed = new discord.MessageEmbed()
				.setColor(errorColor)
				.setAuthor("Evaluation")
				.setTitle("An error occured while executing that code. Here's the error stack")
				.addFields(
					{ name: "Input", value: discord.Formatters.codeBlock("ts", codeToRun.substring(0, 1015)) },
					{ name: "Compiled code", value: discord.Formatters.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1015)) },
					{ name: "Error", value: discord.Formatters.codeBlock(error.stack.substring(0, 1017)) },

					{ name: "Error Type", value: error.name, inline: true },
					{ name: "Error length", value: `${error.stack.length}`, inline: true },
					{ name: "Time taken", value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, inline: true }
				)
				.setFooter(generateTip(), me.displayAvatarURL({ format: "png", dynamic: true }))
			console.error(error)
			await interaction.editReply({ embeds: [embed] })
		}
	}
}

export default command
