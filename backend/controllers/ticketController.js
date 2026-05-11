const db = require('../db');
const { logSystemAction } = require('../utils/logger');

exports.createTicket = (req, res) => {
  const { userId, serviceId, userName } = req.body;

  if (!userId || !serviceId) {
    return res.status(400).json({ error: 'userId and serviceId are required' });
  }

  const proceedWithUser = (validUserId) => {
    // Step 2: Comprehensive validation before creating ticket
    db.query('SELECT is_open, max_capacity, ticket_prefix, ticket_counter FROM services WHERE id = ?', [serviceId], (err, svcRows) => {
      if (err) return res.status(500).json({ error: 'Database error checking service' });
      if (svcRows.length === 0) return res.status(404).json({ error: 'Service not found' });

      const { is_open, max_capacity, ticket_prefix, ticket_counter } = svcRows[0];

      // 1. Check Global Open Status
      if (!is_open) return res.status(403).json({ error: 'Service is currently closed by administration' });

      // 2. Check Schedule and Business Hours
      const now = new Date();
      const dayNum = now.getDay() === 0 ? 7 : now.getDay();

      db.query('SELECT * FROM service_schedules WHERE service_id = ? AND day_of_week = ?', [serviceId, dayNum], (err, schedRows) => {
        if (err) return res.status(500).json({ error: 'Database error checking schedule' });

        const sched = schedRows[0];
        if (sched && sched.is_closed) return res.status(403).json({ error: 'Service is closed today' });

        if (sched) {
          const timeToMin = (t) => { if (!t) return null; const p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
          const currentMin = now.getHours() * 60 + now.getMinutes();
          const mOpen = timeToMin(sched.morning_open);
          const mClose = timeToMin(sched.morning_close);
          const aOpen = timeToMin(sched.afternoon_open);
          const aClose = timeToMin(sched.afternoon_close);

          const inMorning = mOpen !== null && mClose !== null && currentMin >= mOpen && currentMin < mClose;
          const inAfternoon = aOpen !== null && aClose !== null && currentMin >= aOpen && currentMin < aClose;

          if (!inMorning && !inAfternoon) {
            let msg = 'Service is currently outside operational hours.';
            if (mOpen !== null) msg += ` (Morning: ${sched.morning_open}-${sched.morning_close})`;
            if (aOpen !== null) msg += ` (Afternoon: ${sched.afternoon_open}-${sched.afternoon_close})`;
            return res.status(403).json({ error: msg });
          }
        }

        // 3. Check Capacity
        db.query('SELECT COUNT(*) as count FROM tickets WHERE service_id = ? AND status IN ("waiting", "called", "paused")', [serviceId], (err, countRows) => {
          if (err) return res.status(500).json({ error: 'Database error checking capacity' });

          const currentCount = countRows[0].count;
          if (max_capacity && currentCount >= max_capacity) {
            return res.status(403).json({ error: 'Queue has reached maximum capacity. Please try again later.' });
          }

          // Step 4: Atomically increment counter and insert the ticket
          const newCounter = ticket_counter + 1;
          db.query('UPDATE services SET ticket_counter = ? WHERE id = ?', [newCounter, serviceId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error updating counter' });

            const insertQuery = `INSERT INTO tickets (user_id, service_id, status, queue_number) VALUES (?, ?, 'waiting', ?)`;
            db.query(insertQuery, [validUserId, serviceId, newCounter], (err, result) => {
              if (err) return res.status(500).json({ error: `Could not create ticket: ${err.message}` });

              const newTicketId = result.insertId;
              logSystemAction('ticket_created', serviceId, newTicketId, validUserId, { queue_number: newCounter });

              res.json({
                success: true,
                ticketId: newTicketId,
                queueNumber: newCounter,
                ticketPrefix: ticket_prefix,
                position: currentCount, // Position is the current count before adding this ticket
                message: 'Ticket created successfully'
              });
            });
          });
        });
      });
    });
  };

  // Step 1: Verify the user exists or create guest user
  if (typeof userId === 'string' && userId.startsWith('guest_')) {
    const guestEmail = `${userId}@guest.local`;
    const guestName = userName || 'Guest';
    // Create guest user
    db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [guestName, guestEmail, '', 'user'], (err, result) => {
      if (err) {
        console.error('Guest creation error:', err.message);
        return res.status(500).json({ error: 'Failed to create guest user' });
      }
      proceedWithUser(result.insertId);
    });
  } else {
    db.query('SELECT id FROM users WHERE id = ?', [userId], (err, userRows) => {
      if (err) {
        console.error('User check error:', err.message);
        return res.status(500).json({ error: 'Database error checking user' });
      }
      if (userRows.length === 0) {
        return res.status(401).json({ error: 'Session expired. Please log out and log in again.' });
      }
      proceedWithUser(userId);
    });
  }
};

exports.getUserTickets = (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT t.*, s.name as service_name, s.category as service_category, s.icon as service_icon, s.color_theme, s.estimated_wait_time, s.ticket_prefix
    FROM tickets t
    JOIN services s ON t.service_id = s.id
    WHERE t.user_id = ? AND t.status IN ('waiting', 'paused', 'called')
    ORDER BY t.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

exports.getTicketPosition = (req, res) => {
  const ticketId = req.params.id;

  // Find the ticket first to get its service_id and created_at
  db.query('SELECT service_id, created_at FROM tickets WHERE id = ?', [ticketId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const { service_id, created_at } = results[0];

    // Count how many tickets for this service (waiting, called, or paused) have an earlier timestamp
    const q = 'SELECT COUNT(*) as position FROM tickets WHERE service_id = ? AND status IN ("waiting", "called", "paused") AND created_at < ?';
    db.query(q, [service_id, created_at], (err, countRes) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ position: countRes[0].position });
    });
  });
};

exports.getTicketETA = (req, res) => {
  const ticketId = req.params.id;

  db.query('SELECT service_id, created_at, status FROM tickets WHERE id = ?', [ticketId], (err, ticketResults) => {
    if (err || ticketResults.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const { service_id, created_at, status } = ticketResults[0];

    // 1. Get Service Info (Avg time & Active counters)
    db.query('SELECT estimated_wait_time FROM services WHERE id = ?', [service_id], (err, serviceResults) => {
      if (err || serviceResults.length === 0) return res.status(404).json({ error: 'Service not found' });
      const avg_service_time = serviceResults[0].estimated_wait_time || 10;

      db.query('SELECT COUNT(*) as counter_count FROM service_points WHERE service_id = ? AND status = "active"', [service_id], (err, spResults) => {
        const counters = Math.max(1, spResults[0].counter_count || 1);

        // 2. Get currently serving tickets for this service
        db.query('SELECT called_at FROM tickets WHERE service_id = ? AND status = "called" ORDER BY called_at ASC', [service_id], (err, servingTickets) => {

          let total_remaining_serving = 0;
          let is_delayed = false;
          const now = new Date();

          servingTickets.forEach(t => {
            const elapsed = (now - new Date(t.called_at)) / 60000; // in minutes
            const remaining = Math.max(0, avg_service_time - elapsed);
            total_remaining_serving += remaining;
            if (elapsed > avg_service_time) is_delayed = true;
          });

          // 3. Get position in line
          const posQuery = 'SELECT COUNT(*) as position FROM tickets WHERE service_id = ? AND status IN ("waiting", "paused") AND created_at < ?';
          db.query(posQuery, [service_id, created_at], (err, posResults) => {
            if (err) return res.status(500).json({ error: err.message });

            const position = posResults[0].position;

            // 4. Calculate Final ETA (seconds)
            // Logic: (Remaining time of current batch) / Counters + (Waiting batch * avg_time) / Counters
            const eta_minutes = (total_remaining_serving / counters) + (position * avg_service_time / counters);

            // If already called, ETA is 0
            const final_eta_seconds = status === 'called' ? 0 : Math.ceil(eta_minutes * 60);

            res.json({
              status: status,
              eta_seconds: final_eta_seconds,
              position: position,
              avg_service_time: avg_service_time,
              is_delayed: is_delayed,
              show_delay_message: (status === 'waiting' && is_delayed),
              show_approaching_message: (status === 'waiting' && position <= 2 && position > 0),
              eta: new Date(now.getTime() + final_eta_seconds * 1000)
            });
          });
        });
      });
    });
  });
};

exports.updateTicketStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  let timestampField = '';
  if (status === 'called') timestampField = ', called_at = NOW()';
  if (status === 'done') timestampField = ', finished_at = NOW()';

  const query = `UPDATE tickets SET status = ? ${timestampField} WHERE id = ?`;
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating ticket status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    db.query('SELECT service_id FROM tickets WHERE id = ?', [id], (err, rows) => {
      if (!err && rows.length > 0) {
        logSystemAction(`ticket_${status}`, rows[0].service_id, id, req.user?.id || null, { status });
      }
    });
    res.json({ message: 'Ticket updated successfully' });
  });
};

exports.updateTicketStatusSelf = (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (!['paused', 'waiting', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.query('SELECT user_id, status, service_id FROM tickets WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    if (results[0].user_id !== userId) return res.status(403).json({ error: 'You can only modify your own tickets' });

    const currentStatus = results[0].status;
    const serviceId = results[0].service_id;
    if (currentStatus === 'cancelled' || currentStatus === 'done') {
      return res.status(400).json({ error: 'Cannot modify a ' + currentStatus + ' ticket' });
    }

    let query = '';
    let values = [];

    if (status === 'paused') {
      query = `UPDATE tickets SET status = 'paused', is_paused = 1, paused_at = NOW() WHERE id = ?`;
      values = [id];
    } else if (status === 'waiting') {
      query = `UPDATE tickets SET status = 'waiting', is_paused = 0, paused_at = NULL WHERE id = ?`;
      values = [id];
    } else if (status === 'cancelled') {
      query = `UPDATE tickets SET status = 'cancelled', is_paused = 0, paused_at = NULL WHERE id = ?`;
      values = [id];
    }

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating ticket status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      logSystemAction(`ticket_${status}`, serviceId, id, userId, { status });
      res.json({ message: 'Ticket updated successfully' });
    });
  });
};

exports.getAllTicketsAdmin = (req, res) => {
  const { serviceId } = req.query;
  let query = `
    SELECT t.*, u.name as user_name, s.name as service_name, s.estimated_wait_time, sp.name as counter_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN services s ON t.service_id = s.id
    LEFT JOIN service_points sp ON t.service_point_id = sp.id
  `;
  const params = [];

  if (serviceId) {
    query += ` WHERE t.service_id = ? `;
    params.push(serviceId);
  }

  query += ` ORDER BY t.created_at DESC LIMIT 100 `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const now = new Date();
    const enrichedResults = results.map(t => {
      if (t.status === 'called' && t.called_at) {
        const avg_time = t.estimated_wait_time || 10;
        const elapsed_ms = now - new Date(t.called_at);
        const elapsed_mins = elapsed_ms / 60000;
        let progress = (elapsed_mins / avg_time) * 100;

        return {
          ...t,
          elapsed_time_mins: Math.floor(elapsed_mins),
          elapsed_time_secs: Math.floor((elapsed_ms / 1000) % 60),
          remaining_time_mins: Math.max(0, Math.ceil(avg_time - elapsed_mins)),
          progress_percentage: Math.min(150, Math.round(progress)),
          is_delayed: elapsed_mins > avg_time
        };
      }
      return t;
    });

    res.json(enrichedResults);
  });
};

exports.callNextTicket = (req, res) => {
  const { serviceId, servicePointId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

  // Step 1: Find the next waiting ticket for this service
  const query = `
    SELECT * FROM tickets 
    WHERE service_id = ? AND status = 'waiting' 
    ORDER BY created_at ASC LIMIT 1
  `;

  db.query(query, [serviceId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error finding next ticket: ' + err.message });
    if (results.length === 0) return res.status(404).json({ error: 'No tickets in queue for this service' });

    const ticketId = results[0].id;

    // Step 2: Update ticket status and assign to service point
    const updateQuery = `
      UPDATE tickets 
      SET status = 'called', called_at = CURRENT_TIMESTAMP, service_point_id = ? 
      WHERE id = ?
    `;

    db.query(updateQuery, [servicePointId || null, ticketId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error updating ticket status: ' + err.message });
      logSystemAction('ticket_called', serviceId, ticketId, req.user?.id || null, { servicePointId });
      res.json({ success: true, message: 'Ticket called successfully', ticketId });
    });
  });
};

exports.transferTicket = (req, res) => {
  const { id } = req.params;
  const { targetServiceId } = req.body;

  if (!targetServiceId) return res.status(400).json({ error: 'targetServiceId is required' });

  db.query('SELECT service_id FROM tickets WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const originalServiceId = results[0].service_id;

    const query = `
      UPDATE tickets 
      SET service_id = ?, status = 'waiting', service_point_id = NULL, called_at = NULL 
      WHERE id = ?
    `;

    db.query(query, [targetServiceId, id], (err) => {
      if (err) return res.status(500).json({ error: 'Database error transferring ticket: ' + err.message });
      logSystemAction('ticket_transferred', originalServiceId, id, req.user?.id || null, { targetServiceId });
      res.json({ success: true, message: 'Ticket transferred successfully' });
    });
  });
};
