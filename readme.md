# Appsch

A appliaction to manage staff administration allowance based on performance ever day in school. this appliaction collect data about staff, task, allowance, and performance on working.

## Database Connection Checking

The application now includes automatic database connection checking with the following features:

- **Startup Check**: Database connection is verified when the server starts
- **Request-time Check**: Every request (except static files) is checked for database connectivity
- **Error Page**: If database connection fails, a user-friendly error page is displayed
- **Auto-refresh**: The error page automatically refreshes every 30 seconds
- **Manual Retry**: Users can manually retry the connection

### Testing Database Connection

To test the database connection separately:

```bash
npm run test:db
```

### Error Handling

When database connection fails:
- The server will still start but show error pages for all requests
- Detailed error messages are logged to the console
- Users see a friendly error page with retry options
- Static files (CSS, JS, images) are still served normally

## Screenshots

![demo application](https://github.com/aliefadityanugraha/appsch/blob/dev/demo.png)


## Tech Stack

**Client:** Html, Css, Bootstrap CSS, Jquery, Datatable, Hansontable, Chart.js

**Server:** Node, Express, Prisma, Mysql


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DATABASE_URL`

`SHADOW_DATABASE_URL`

`PORT`

`NODE_ENV`

`ACCESS_SECRET_KEY`

`REFRESH_SECRET_KEY`

## Installation

##### Clone project
```bash
    git clone https://github.com/aliefadityanugraha/appsch.git
```
##### Change folder to project folder
```bash
    cd appsch
```
##### Install depedencies with npm
```bash
    npm Install
```
##### Run dev server
```bash
    npm run dev
```
## Authors

- [@aliefadityanugraha](https://www.github.com/aliefadityanugraha)


[
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174037",
        "taskValue": 10,
        "taskDescription": "Coordinate project schedules"
    },
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174038",
        "taskValue": 9,
        "taskDescription": "Monitor project progress"
    },
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174039",
        "taskValue": 11,
        "taskDescription": "Prepare project status reports"
    }
]

[
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174019",
        "checked": true,
        "taskValue": 13,
        "taskDescription": "Oversee marketing campaigns"
    },
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174020",
        "checked": true,
        "taskValue": 11,
        "taskDescription": "Analyze campaign ROI"
    },
    {
        "taskId": "123e4567-e89b-12d3-a456-426614174021",
        "checked": true,
        "taskValue": 15,
        "taskDescription": "Develop new promotional strategies"
    }
]