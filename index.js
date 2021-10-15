const fs = require("fs").promises;
(async () => {
  /**
   * Gets the timesheet data
   * @returns
   */
  const getData = async () => {
    const employeeTimesheets = [];
    let timesheets = await fs.readFile("./data/timesheet.csv", "utf8");
    timesheets = timesheets
      .replace(/(\r|\r)/gm, "")
      .replace(/['"]+/g, "")
      .split("\n");

    let timesheetCounter = 0;
    for await (const timesheet of timesheets) {
      if (timesheetCounter === 0) {
        timesheetCounter++;
        continue;
      }
      const data = timesheet.split(",");

      employeeTimesheets.push({
        name: data[0],
        mon: data[1],
        tue: data[2],
        wed: data[3],
        thu: data[4],
        fri: data[5],
        sat: data[6],
        sun: data[7],
      });

      timesheetCounter++;
    }
    return employeeTimesheets;
  };

  /**
   * Calculates paid hours
   * @param {String} hours
   * @returns
   */
  const calculatePaidHours = async (hours) => {
    if (hours === "") {
      return 0;
    }
    const lunchBreak = 1;
    const hoursSplit = hours.split("-");
    const timeStart = new Date();
    const timeEnd = new Date();
    const start = `${hoursSplit[0]}`.split(":");
    const end = `${hoursSplit[1]}`.split(":");
    timeStart.setHours(start[0], start[1], 0, 0);
    timeEnd.setHours(end[0], end[1], 0, 0);
    return ((timeEnd - timeStart) / (1000 * 60 * 60)).toFixed(1) - lunchBreak;
  };

  /**
   * Calculates Hours
   * @param {Array} timesheet
   * @returns
   */
  const calculateHours = async (timesheet) => {
    const formattedTimesheet = [];
    formattedTimesheet.push({
      name: timesheet.name,
      mon: await calculatePaidHours(timesheet.mon),
      tue: await calculatePaidHours(timesheet.tue),
      wed: await calculatePaidHours(timesheet.wed),
      thu: await calculatePaidHours(timesheet.thu),
      fri: await calculatePaidHours(timesheet.fri),
      sat: await calculatePaidHours(timesheet.sat),
      sun: await calculatePaidHours(timesheet.sun),
    });
    return formattedTimesheet;
  };

  /**
   * Calculates Overtime
   * @param {Array} hours
   * @returns
   */
  const calculateOvertime = async (hours) => {
    const formattedOvertime = [];
    for await (const employee of hours) {
      formattedOvertime.push({
        name: employee[0].name,
        weeklyHoursOver40: await calculateOvertimeWeeklyHoursOver40(
          employee[0]
        ),
        dailyHoursOver8UpTo12: await calculateOvertimeDailyHoursOver8UpTo12(
          await calculateOvertimeDailyHoursOver8(employee[0])
        ),
        dailyHoursOver12: await calculateOvertimeDailyHoursOver12(employee[0]),
        consecutiveDaysWorked: await calculateOvertimeConsecutiveDaysWorked(
          employee[0]
        ),
        hours: {
          mon: employee[0].mon,
          tue: employee[0].tue,
          wed: employee[0].wed,
          thu: employee[0].thu,
          fri: employee[0].fri,
          sat: employee[0].sat,
          sun: employee[0].sun,
        },
      });
    }
    return formattedOvertime;
  };

  /**
   * Calculates Overtime over 40 hours
   * @param {Object} employee
   * @returns
   */
  const calculateOvertimeWeeklyHoursOver40 = async (employee) => {
    const hoursWorked =
      employee.mon +
      employee.tue +
      employee.wed +
      employee.thu +
      employee.fri +
      employee.sat +
      employee.sun;
    if (hoursWorked > 40) {
      return hoursWorked - 40;
    }
    return 0;
  };

  /**
   * Calculates Overtime over 8 hours
   * @param {Object} employee
   * @returns
   */
  const calculateOvertimeDailyHoursOver8 = async (employee) => {
    const hoursWorkedOver8 = {
      mon: employee.mon > 8 ? employee.mon - 8 : 0,
      tue: employee.tue > 8 ? employee.tue - 8 : 0,
      wed: employee.wed > 8 ? employee.wed - 8 : 0,
      thu: employee.thu > 8 ? employee.thu - 8 : 0,
      fri: employee.fri > 8 ? employee.fri - 8 : 0,
      sat: employee.sat > 8 ? employee.sat - 8 : 0,
      sun: employee.sun > 8 ? employee.sun - 8 : 0,
    };
    return hoursWorkedOver8;
  };

  /**
   * Calculates Overtime over 8 up to 12
   * @param {Object} employee
   * @returns
   */
  const calculateOvertimeDailyHoursOver8UpTo12 = async (hoursWorkedOver8) => {};

  /**
   * Calculates Overtime over 12 hours
   * @param {Object} employee
   * @returns
   */
  const calculateOvertimeDailyHoursOver12 = async (employee) => {};

  /**
   * Calculates Overtime consecuctive days worked
   * @param {Object} employee
   * @returns
   */
  const calculateOvertimeConsecutiveDaysWorked = async (employee) => {};

  /**
   * Formats the list for display
   * @param {Array} formattedTimesheets
   * @returns
   */
  const formatForList = async (formattedTimesheets) => {
    const listFormat = [];
    for await (const formattedTimesheet of formattedTimesheets) {
      listFormat.push({
        name: formattedTimesheet.name,
        hoursWorked:
          formattedTimesheet.mon +
          formattedTimesheet.tue +
          formattedTimesheet.wed +
          formattedTimesheet.thu +
          formattedTimesheet.fri +
          formattedTimesheet.sat +
          formattedTimesheet.sun,
      });
    }
    return listFormat;
  };

  /**
   * Comapres last names for sort
   * @param {String} a
   * @param {String} b
   * @returns
   */
  const compareNames = (a, b) => {
    if (a.last_name < b.last_name) {
      return -1;
    }
    if (a.last_name > b.last_name) {
      return 1;
    }
    return 0;
  };

  /**
   * Sorts list based on last name
   * @param {Array} list
   * @returns
   */
  const sortList = async (list) => {
    const newList = [];
    for await (const row of list) {
      newList.push({
        first_name: row[0].name.split(" ")[0],
        last_name: row[0].name.split(" ")[1],
        hoursWorked: row[0].hoursWorked,
      });
    }
    newList.sort(compareNames);
    return newList;
  };

  /**
   * Displays the list
   * @param {String} title
   * @param {Array} list
   */
  const displayList = async (title, list) => {
    list = await sortList(list);
    console.log(`\n\n-- ${title} --\n\n`);
    for await (const row of list) {
      console.log(
        `${row.last_name}, ${row.first_name}: ${row.hoursWorked} hours`
      );
    }
    console.log(`\n\n-------\n\n`);
  };

  /**
   * Filters list for under 40 hours worked
   * @param {Array} list
   */
  filterForListUnder40Hours = async (list) => {
    const newList = [];
    for await (const row of list) {
      if (row[0].hoursWorked < 40) {
        newList.push(row);
      }
    }
    return newList;
  };

  /**
   * Filters list for weekend hours worked
   * @param {Array} list
   */
  filterForListWeekends = async (list) => {
    const newList = [];
    for await (const row of list) {
      if (row[0].sat || row[0].sun) {
        newList.push([
          {
            name: row[0].name,
            hoursWorked: row[0].sat + row[0].sun,
          },
        ]);
      }
    }
    return newList;
  };

  /**
   * Filters list for overtime hours worked
   * @param {Array} list
   */
  filterForListOvertime = async (list) => {};

  /**
   * Filters list
   * @param {Integer} listId
   * @param {Array} list
   */
  const filterList = async (listId, list) => {
    switch (listId) {
      case 2:
        return await filterForListUnder40Hours(list);
      case 3:
        return await filterForListWeekends(list);
      case 4:
        return await filterForListOvertime(list);
      default:
        return;
    }
  };

  /**
   * Lists employees and total paid hours
   * @param {Array} timesheets
   */
  const listEmployeesAndTotalPaidHours = async (timesheets) => {
    let list = [];
    for await (const timesheet of timesheets) {
      list.push(await formatForList(await calculateHours(timesheet)));
    }
    displayList("All Employees and Total Paid Hours Worked", list);
  };

  /**
   * Lists employees and under 40 hours
   * @param {Array} timesheets
   */
  const listEmployeesUnder40Hours = async (timesheets) => {
    const list = [];
    let newList = [];
    for await (const timesheet of timesheets) {
      list.push(await formatForList(await calculateHours(timesheet)));
      newList = await filterList(2, list);
    }
    displayList(
      "All Employees That Worked Under 40 and Total Hours Worked",
      newList
    );
  };

  /**
   * Lists employees weekend hours
   * @param {Array} timesheets
   */
  const listEmployeesWeekends = async (timesheets) => {
    const hours = [];
    let list = [];
    for await (const timesheet of timesheets) {
      hours.push(await calculateHours(timesheet));
      list = await filterList(3, hours);
    }
    displayList(
      "All Employees That Worked Weekends and Total Paid Weekend Hours Worked",
      list
    );
  };

  /**
   * Lists employees overtime
   * @param {Array} timesheets
   */
  const listEmployeesOvertime = async (timesheets) => {
    const hours = [];
    let list = [];
    for await (const timesheet of timesheets) {
      hours.push(await calculateHours(timesheet));
    }
    await calculateOvertime(hours);
    //   list = await filterList(3, hours);

    displayList(
      "All Employees That Worked Weekends and Total Paid Weekend Hours Worked",
      list
    );
  };

  /**
   * Lists the employees and hours
   * @param {Array} timesheets
   */
  const listEmployees = async (timesheets) => {
    await listEmployeesAndTotalPaidHours(timesheets);
    await listEmployeesUnder40Hours(timesheets);
    await listEmployeesWeekends(timesheets);
    await listEmployeesOvertime(timesheets);
  };

  await listEmployees(await getData());
})();
