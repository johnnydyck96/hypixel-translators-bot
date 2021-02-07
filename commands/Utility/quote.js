const { errorColor, successColor, neutralColor } = require("../../config.json")
const Discord = require("discord.js")
const { getDb } = require("../../lib/mongodb")

module.exports = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "+quote [index] | quote add <quote> / <author mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-development bot-translators
    execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const collection = getDb().collection("quotes")
        let allowed = false
        if (message.channel.type !== "dm" && message.member?.hasPermission("VIEW_AUDIT_LOG")) allowed = true // Discord Staff
        message.channel.startTyping()
        if (args[0] === "add") {
            args.splice(0, 1)
            const toSend = args.join(" ")
            const fullQuote = toSend.split(" / ")
            let quote = fullQuote[0]
            const author = fullQuote[1]
            if (!quote) {
                throw "noQuote"
            }
            if (!author) {
                throw "noUserQuote"
            }
            if (!allowed) {
                const sendTo = message.client.channels.cache.get("624881429834366986") //staff-bots
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Quote")
                    .setTitle("A quote request has been submitted!")
                    .setDescription(quote + "\n       - " + author)
                    .addFields({ name: "To add it", value: "`+quote add " + toSend + "`" })
                    .setFooter("Suggested by " + message.author.tag, message.author.displayAvatarURL())
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.reqSub)
                    .setDescription(quote + "\n       - " + author)
                    .setFooter(executedBy, message.author.displayAvatarURL())
                message.channel.stopTyping()
                message.channel.send(embed)
            } else addQuote(executedBy, message, quote, author, collection)
        } else if (args[0] === "edit") editQuote(executedBy, message, args, collection)
        else if (args[0] === "delete") deleteQuote(executedBy, message, args, collection)
        else findQuote(executedBy, message, strings, args, collection)
    }
}

async function findQuote(executedBy, message, strings, args, collection) {

    const all = await collection.find({}).toArray()

    let quoteId
    if (!args[0]) quoteId = Math.ceil(Math.random() * Math.floor(all.length)) //generate random id if no arg is given
    else quoteId = Number(args[0])
    console.log(`Quote with ID ${quoteId} was requested`)

    const quote = await collection.findOne({ id: quoteId })
    if (!quote) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.invalidArg)
            .setDescription(strings.indexArg.replace("%%arg%%", args[0]).replace("%%max%%", all.length))
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        return message.channel.send(embed)
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(quote.quote)
        .setDescription(`      - ${quote.author}`)
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    return message.channel.send(embed)
}

async function addQuote(executedBy, message, quote, author, collection) {

    const all = collection.find({}).toArray()
    const quoteId = all.length + 1

    collection.insertOne({ id: quoteId, quote: quote, author: author }).then(result => {
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Quote")
            .setTitle("Success! The following quote has been added:")
            .setDescription(result.quote)
            .addFields(
                { name: "User", value: result.author },
                { name: "Quote number", value: quoteId }
            )
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
    })
}

async function editQuote(executedBy, message, args, collection) {

    const quoteId = args[1]
    args.splice(0, 2)
    const newQuote = args.join(" ")
    if (!quoteId || !newQuote) throw "noQuote"
    const oldQuote = collection.findOne({ id: quoteId })
    collection.updateOne({ id: quoteId }, { $set: { quote: newQuote } })
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor("Quote")
        .setTitle(`Successfully edited quote #${quoteId}`)
        .addFields(
            { name: "Old quote", value: oldQuote.quote },
            { name: "New quote", value: newQuote }
        )
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
}

async function deleteQuote(executedBy, message, args, collection) {

    const quoteId = args[1]
    if (!quoteId) throw "noQuote"
    const oldQuote = collection.findOne({ id: quoteId })
    collection.deleteOne({ id: quoteId }, { quote: newQuote })
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor("Quote")
        .setTitle(`Successfully deleted quote #${quoteId}`)
        .addFields(
            { name: "User", value: oldQuote.author },
            { name: "Quote", value: oldQuote.quote }
        )
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
}
