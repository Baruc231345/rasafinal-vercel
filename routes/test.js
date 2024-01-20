async function checkSufficient(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db1.query(
        'SELECT event_day, start_time, end_time FROM inputted_table WHERE id = ?',
        [id]
      );

      // Assuming the query result is an array of rows
      const [row] = result;

      // Check if a row was found
      if (row) {
        const { event_day, start_time, end_time } = row;

        // Do something with the retrieved data
        // For example, you can resolve with an object containing the data
        resolve({
          eventDay: event_day,
          startTime: start_time,
          endTime: end_time,
        });
      } else {
        // If no row is found, you might want to reject with an error or appropriate message
        reject(new Error('No data found for the specified ID.'));
      }
    } catch (error) {
      // Handle any database error
      reject(error);
    }
  });
}