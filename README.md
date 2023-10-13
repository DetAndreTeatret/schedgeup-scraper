A web scraper used to fetch information from SchedgeUp (https://www.schedgeup.com)

Expects the following env variables to be present in `process.env`:

- `SCHEDGEUP_EMAIL` : email for user used to log into SchedgeUp
- `SCHEDGEUP_PASS` : password for user used to log into SchedgeUp
- `THEATRE_ID` : To find Theatre ID log into SchedgeUp and navigate to either Theatre Schedule or Calendar,
  ID will be in the URL (e.g `https://www.schedgeup.com/theatres/====>59<====/events`)
