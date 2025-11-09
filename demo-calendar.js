#!/usr/bin/env node
/**
 * Demo script to test the /calendar command
 * Usage: node demo-calendar.js
 */

const { CommandRouter } = require('./src/commands/router');
const { registerCalendarCommands } = require('./src/commands/calendar-commands');
const CalendarManager = require('./src/calendar/calendar-manager');
const path = require('path');

async function runCalendarDemo() {
  console.log('='.repeat(70));
  console.log('CALENDAR COMMAND DEMO');
  console.log('='.repeat(70));
  console.log();

  try {
    // Set up calendar manager
    const calendarPath = path.join(process.cwd(), 'data', 'calendar.yaml');
    const calendarManager = new CalendarManager({ calendarPath });

    // Check if calendar exists, create if not
    const calendarCheck = await calendarManager.loadCalendar();
    if (!calendarCheck.success || !calendarCheck.calendar.current) {
      console.log('⚠️  Calendar not found or incomplete. Creating default calendar...\n');
      await calendarManager.createCalendar('735-10-01', '14:30');
      console.log('✅ Default calendar created!\n');
    }

    // Initialize command router
    const router = new CommandRouter();

    // Register calendar command
    registerCalendarCommands(router, { calendarManager });

    console.log('Executing: /calendar\n');
    console.log('─'.repeat(70));
    console.log();

    // Execute /calendar command
    const output = await router.routeCommand('calendar', []);

    // Display output
    console.log(output);
    console.log();
    console.log('─'.repeat(70));
    console.log();
    console.log('✅ Calendar command executed successfully!');
    console.log();
    console.log('💡 Tip: Edit data/calendar.yaml to change the date, weather, or add events.');
    console.log();

  } catch (error) {
    console.error('❌ Error executing calendar command:', error.message);
    console.error();
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the demo
runCalendarDemo();
