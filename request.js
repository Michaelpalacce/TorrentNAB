const request	= require( 'http' );

module.exports	= function ( path, method = 'GET', headers = {}, data = '' ) {
	return new Promise(( resolve,reject ) => {
		const predefinedHeaders	= {
			'Content-Length': Buffer.byteLength( data )
		};

		headers	= { ...predefinedHeaders, ...headers };

		const options	= {
			hostname	: 'localhost',
			path,
			method,
			headers
		};

		const req	= request( options, ( res ) => {
			const bodyParts	= [];
			res.on( 'data',( chunk ) => {
				bodyParts.push( chunk );
			});

			res.on( 'end',() => {
				res.body	= Buffer.concat( bodyParts );
				return resolve( res );
			});
		});

		req.on('error', ( e ) => {
			reject( e );
		});

		req.write( data );
		req.end();
	});
}