// Netlify Serverless Function for fetching Airtable data without exposing the API key

exports.handler = async (event, context) => {
const allowedOrigins = [
    "https://bluebird-tarantula-djcw.squarespace.com",  // Your live site
    "https://bluebird-tarantula-djcw.squarespace.com/config/pages",  // Squarespace Editor
    "https://www.scarevision.co.uk"  // If you use a custom domain
  ];

  const requestOrigin = event.headers.origin || event.headers.referer || '';

  if (!allowedOrigins.some(origin => requestOrigin.startsWith(origin))) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': requestOrigin,  // Allow browser to see the error
      },
      body: JSON.stringify({ success: false, error: "Access denied" }),
    };
  }
  
  // 1. Read environment variables (Set these in Netlify later)
  const airtableApiKey = process.env.AIRTABLE_API_KEY;  // patXXXX...
  const baseId = process.env.AIRTABLE_BASE_ID;          // e.g. appF8TzWUaEgLtbml

  // 2. Get "table" from query string, defaulting to "Case 1"
  //    e.g. ?table=Case%202
  let tableName = event.queryStringParameters.table || 'Case 1';
  tableName = encodeURIComponent(tableName);

  try {
    // 3. Build the Airtable REST API URL
    //    This example fetches up to 5 records; adjust if needed.
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}?maxRecords=300`;

    // 4. Use fetch (Netlify runs on Node 18 by default, which supports fetch)
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error. Status: ${response.status}`);
    }

    // 5. Parse the returned JSON
    const data = await response.json();

    // 6. Return success response with data and CORS headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  // so Squarespace can call
      },
      body: JSON.stringify({
        success: true,
        records: data.records
      })
    };

  } catch (err) {
    console.error('Error fetching Airtable:', err);

    // 7. Return error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};
