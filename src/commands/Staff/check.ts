import { blurple } from "../../config.json"
import Discord from "discord.js"
import { db, DbUser } from "../../lib/dbclient"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "check",
  description: "Shows information about the specified user.",
  options: [{
    type: "USER",
    name: "user",
    description: "The user to check",
    required: false
  }],
  roleWhitelist: ["768435276191891456", "551758391127834625", "748269219619274893", "645709877536096307", "752541221980733571"], //Discord Staff and Hypixel, SBA, QP and Bot managers
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
    const member = interaction.options.get("user")?.member as Discord.GuildMember ?? interaction.member as Discord.GuildMember

    const userDb: DbUser | null = await db.collection("users").findOne({ id: member.user.id })
    let note
    if (member.user.id === interaction.guild!.ownerID) note = "Discord Owner"
    else if (member.roles.cache.find(r => r.name === "Discord Owner")) note = "Discord Co-Owner"
    else if (member.roles.cache.find(r => r.name === "Discord Administrator")) note = "Discord Administrator"
    else if (member.roles.cache.find(r => r.name === "Discord Moderator")) note = "Discord Moderator"
    else if (member.roles.cache.find(r => r.name === "Discord Helper")) note = "Discord Helper"
    else if (member.roles.cache.find(r => r.name.endsWith(" Manager"))) note = "Project Manager"
    else if (member.roles.cache.find(r => r.name === "Hypixel Staff")) note = "Hypixel Staff Member"
    else if (userDb?.profile) note = userDb.profile

    let color = member.displayHexColor
    if (color === "#000000") color = blurple
    let timeZone = getString("region.timeZone", "global")
    if (timeZone.startsWith("crwdns")) timeZone = getString("region.timeZone", "global", "en")
    const joined = member.joinedAt!.toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" }),
      created = member.user.createdAt.toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" }),
      joinedAgo = Math.round(member.joinedAt!.getTime() / 1000),
      createdAgo = Math.abs(member.user.createdAt.getTime() / 1000),
      rolesCache = member.roles.cache
    let userRoles: string
    if (rolesCache.size !== 1) {
      rolesCache.delete("549503328472530974")
      userRoles = rolesCache.sort((a: Discord.Role, b: Discord.Role) => b.position - a.position).map((r: Discord.Role) => r).join(", ")
    } else userRoles = "No roles yet!"

    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor("User information", member.user.displayAvatarURL({ format: "png", dynamic: true }))
      .setTitle(member.user.tag)
      .setDescription(`${member} (ID: ${member.user.id})`)
      .addFields(
        { name: "Joined on", value: `${joined} (<t:${joinedAgo}:R>)`, inline: true },
        { name: "Account created on", value: `${created} (<t:${createdAgo}:R>)`, inline: true },
        { name: "Roles", value: userRoles },
      )
      .setThumbnail(member.user.displayAvatarURL({ format: "png", dynamic: true }))
      .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    if (note) embed.addField("Note", note)
    await interaction.reply({ embeds: [embed] })
  }
}

export default command
