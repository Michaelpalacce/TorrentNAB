const Discord = require('discord.js');
const {Intents, MessageAttachment} = require("discord.js");
const axios = require("axios");
const parser = require('fast-xml-parser');
const fs = require("fs");
const http = require("http");

const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }); //create new client

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.login('ODkwNjQyOTA4MDgzMDIzOTQz.YUyx2A.Fwlvv2PR8YPLpYs4w-P_Y6g42Nc');

client.on('messageCreate', async function ( message ) {
	if (message.content.indexOf( '!torrent' ) === 0 ) {
		messageContent	= message.content;
		let args		= messageContent.split( ' ', 3 );
		const cmd		= args[1];
		const search	= messageContent.substring( messageContent.indexOf( cmd ) + cmd.length );

		switch(cmd) {
			case 'search':
				console.log( search.replace( /'/g, '' ) );
				const results	= await getResult( search.replace( /'/g, '' ).trim() );
				const fileName	= `${results[0].title}.torrent`;
				const location	= `Torrents/${fileName}`;
				const file		= fs.createWriteStream( location );

				http.get(results[0].enclosure.url, function(response) {
					response.pipe(file);

					setTimeout(() => {
						message.channel.send(new MessageAttachment( fs.createReadStream( location ), fileName, fs.readFileSync( location ) ) ).catch(console.error);
					}, 500);
				});
				break;
		}
	}
});

async function getResult( searchQuery, indexer = 'zamundanet', results = 10 ) {
	const response		= await axios.get( `http://192.168.1.182:30105/api/v2.0/indexers/${indexer}/results/torznab/api?apikey=56a0hhf6k8awc7jz5olx3rzevforx7x6&t=search&cat=&q=${searchQuery.replace( ' ', '+')}` );

	const jsonResponse	= parser.parse( response.data, { ignoreAttributes : false, attributeNamePrefix : "" } );

	return jsonResponse.rss.channel.item.splice( 0, results );
}
