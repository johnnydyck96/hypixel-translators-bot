import { db, DbUser } from "../../lib/dbclient"
import { successColor, errorColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { client, Command, GetStringFunction } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "profile",
	description: "Gets the profile of a user",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to find the profile for. Admin only.",
		required: false
	},
	{
		type: "STRING",
		name: "profile",
		description: "The new profile to set for the user. Admin only.",
		required: false
	}],
	async execute(interaction, getString: GetStringFunction) {
		const collection = db.collection<DbUser>("users"),
			user = interaction.options.getUser("user", false),
			profile = interaction.options.getString("profile", false)
		if ((interaction.member as Discord.GuildMember).roles.cache.has("764442984119795732") && user) { //Discord Administrator
			if (!profile) {
				const userDb = await client.getUser(user?.id)
				if (userDb.profile) {
					const embed = new Discord.MessageEmbed()
						.setColor(neutralColor as Discord.HexColorString)
						.setAuthor("Crowdin Profile")
						.setTitle(`Here's ${user.tag}'s Crowdin profile`)
						.setDescription(userDb.profile)
						.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				} else {
					const embed = new Discord.MessageEmbed()
						.setColor(errorColor as Discord.HexColorString)
						.setAuthor("Crowdin Profile")
						.setTitle(`Couldn't find ${user.tag}'s Crowdin profile on the database!`)
						.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				}
			} else {
				if (/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(profile)) {
					const result = await collection.findOneAndUpdate({ id: user.id }, { $set: { profile: profile } })
					if (result.value!.profile !== profile) {
						const embed = new Discord.MessageEmbed()
							.setColor(successColor as Discord.HexColorString)
							.setAuthor("User Profile")
							.setTitle(`Successfully updated ${user.tag}'s Crowdin profile!`)
							.addFields(
								{ name: "Old profile", value: result.value!.profile || "None" },
								{ name: "New profile", value: profile }
							)
							.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
						return await interaction.reply({ embeds: [embed], ephemeral: true })
					} else {
						const embed = new Discord.MessageEmbed()
							.setColor(errorColor as Discord.HexColorString)
							.setAuthor("User Profile")
							.setTitle(`Couldn't update ${user.tag}'s Crowdin profile!`)
							.setDescription("Their current profile is the same as the one you tried to add.")
							.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
						return await interaction.reply({ embeds: [embed], ephemeral: true })
					}
				} else throw "wrongLink"
			}
		} else if ((interaction.member as Discord.GuildMember).roles.cache.has("764442984119795732") && !user && profile) {
			const profileUser = await db.collection<DbUser>("users").findOne({ profile: profile.toLowerCase() })
			if (profileUser) {
				const userObject = await client.users.fetch(profileUser.id),
					embed = new Discord.MessageEmbed()
						.setColor(neutralColor as Discord.HexColorString)
						.setAuthor("Crowdin Profile")
						.setTitle(`That profile belongs to ${userObject.tag}`)
						.setDescription(`${userObject}: ${profileUser.profile!}`)
						.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			} else {
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor("Crowdin Profile")
					.setTitle("Couldn't find a user with that profile!")
					.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		} else {
			const randomTip = generateTip(getString),
				userDb = await client.getUser(interaction.user.id)
			if (userDb.profile) {
				const embed = new Discord.MessageEmbed()
					.setColor(neutralColor as Discord.HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("profileSuccess"))
					.setDescription(userDb.profile)
					.setFooter(randomTip, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			} else {
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("noProfile"))
					.setDescription(getString("howStore"))
					.setFooter(randomTip, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		}
	}
}

export default command
