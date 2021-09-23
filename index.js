const Discord = require('discord.js');
const {Intents} = require("discord.js");
const axios = require("axios");
const parser = require('fast-xml-parser');
const http = require("http");

let lastDL	= 0;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }); //create new client

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.login('');

client.on('messageCreate', async function ( message ) {
	try
	{
		if ( message.content.indexOf( '!swear' ) === 0 ) {
			if ( message.mentions.users.size !== 1 ) {
				return;
			}

			const user		= message.mentions.users.entries().next().value
			const insult	= await axios.get( `https://evilinsult.com/generate_insult.php` );

			if ( user[1].username === 'stefantigro' ) {
				message.channel.send( `Blessed be my creator <@${user[0]}>, please do not kill me. (<@${message.author.id}> ${insult.data})` );
				return;
			}

			message.channel.send( `<@${user[0]}>, ${insult.data}` )
		}

		if ( message.content.indexOf( '!torrent' ) === 0 ) {
			if ( lastDL > Date.now() ){
				message.channel.send( `Too Fast, wait ${(lastDL - Date.now())/1000} seconds` ).catch(console.error);
				return;
			}

			lastDL	= Date.now() + 3000;
			let messageContent	= message.content;
			console.log( `Received Query: ${messageContent}` );
			let args			= messageContent.split( ' ', 3 );
			const cmd			= args[1];
			let search			= messageContent.substring( messageContent.indexOf( cmd ) + cmd.length ).trim();
			let results, fileName;

			switch(cmd) {
				case 'search':
					results	= await getResult( search );
					if ( ! results ){
						message.channel.send( 'Nothing found' ).catch(console.error);
						break;
					}

					let reply	= `Found:`;
					for ( const index in results )
						reply	+= `\n${ parseInt( index ) + 1}. [${results[index].title}](${results[index].guid}) Peers: ${results[index]['torznab:attr'].filter( attribute => attribute.name === 'peers')[0].value} Seeders: ${results[index]['torznab:attr'].filter( attribute => attribute.name === 'seeders')[0].value}\n`;

					message.channel.send( reply ).catch(console.error);

					break;
				case 'lucky':
					results	= await getResult( search );
					if ( ! results ){
						message.channel.send( 'Nothing found' ).catch(console.error);
						break;
					}
					fileName	= `${results[0].title}.torrent`;

					http.get(results[0].enclosure.url, function(response) {
						setTimeout(() => {
							message.channel.send({content: fileName, files: [
									{ attachment: response, name: fileName }
								]}).catch(console.error);
						}, 500);
					});
					break;
				case 'dl':
					const searchArgs		= search.split( ' ' );
					let numberToDownload	= parseInt( searchArgs.shift() );
					if ( Number.isNaN( numberToDownload ) ) {
						message.channel.send( 'Fuck u send me a number' ).catch(console.error);
						return;
					}
					numberToDownload--;

					search					= searchArgs.join( ' ' ).trim();
					results	= await getResult( search );
					if ( ! results ){
						message.channel.send( 'Nothing found' ).catch(console.error);
						break;
					}
					fileName	= `${results[numberToDownload].title}.torrent`;

					http.get(results[numberToDownload].enclosure.url, function(response) {
						setTimeout(() => {
							message.channel.send({content: fileName, files: [
									{ attachment: response, name: fileName }
								]}).catch(console.error);
						}, 500);
					});
					break;
				case 'help':
				default:
					message.channel.send( 'Search for a torrent: `!torrent search \'See S01\'`' +
						'\n Download the torrent: `!torrent dl 2 \'See S01\'`' +
						'\n I know what I am doing JUST GIVE TORRENT: `!torrent lucky \'See S01\'`' ).catch(console.error);
					break;
			}
		}
	}
	catch ( e ){
		console.error( e );
	}
});

async function getResult( searchQuery, indexer = 'zamundanet', results = 10 ) {
	const response		= await axios.get( `http://192.168.1.182:30105/api/v2.0/indexers/${indexer}/results/torznab/api?apikey=56a0hhf6k8awc7jz5olx3rzevforx7x6&t=search&cat=&q=${searchQuery.replace( ' ', '+')}` );

	const jsonResponse	= parser.parse( response.data, { ignoreAttributes : false, attributeNamePrefix : "" } );

	if ( jsonResponse.rss.channel.item && jsonResponse.rss.channel.item.length > 0 ){
		return jsonResponse.rss.channel.item.splice( 0, results );
	}

	return null;
}
