A web scraper used to fetch information from SchedgeUp (https://www.schedgeup.com)

Expects the following env variables to be present in `process.env`:

- `SCHEDGEUP_EMAIL` : email for user used to log into SchedgeUp
- `SCHEDGEUP_PASS` : password for user used to log into SchedgeUp
- `THEATRE_ID` : To find Theatre ID log into SchedgeUp and navigate to either Theatre Schedule or Calendar,
  ID will be in the URL (e.g `https://www.schedgeup.com/theatres/====>59<====/events`)

Optionally the env variable `NATIVE_COUNTRY_CODE` could be set for proper parsing of badly 
formatted phone numbers from the users page. (defaults to "NO" for Norway)
