const db = require('../db');
const crypto = require('crypto');

exports.getServices = (req, res) => {
  const query = `
    SELECT 
      s.*, 
      (SELECT COUNT(*) FROM tickets t WHERE t.service_id = s.id AND t.status = 'waiting') as people_waiting
    FROM services s
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
};

exports.createService = async (req, res) => {
  const {
    name,
    category,
    description,
    icon,
    color_theme,
    address,
    lat,
    lng,
    phone_number,
    email_address,
    website,
    logo_url,
    banner_url,
    cover_image_url
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    const serviceId = crypto.randomUUID();
    const query = `
      INSERT INTO services (
        id, name, category, description, icon, 
        color_theme, address, lat, lng, 
        phone_number, email_address, website, logo_url, banner_url, cover_image_url,
        estimated_wait_time, is_fast_track_available, is_open, max_capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      serviceId,
      name,
      category || '',
      description || null,
      icon || null,
      color_theme || null,
      address || null,
      lat || null,
      lng || null,
      phone_number || null,
      email_address || null,
      website || null,
      logo_url || null,
      banner_url || null,
      cover_image_url || null,
      10, // default estimated_wait_time
      false, // default is_fast_track_available
      true, // default is_open
      null // default max_capacity
    ], (err, result) => {
      if (err) {
        console.error('Error creating service:', err);
        return res.status(500).json({ error: 'Failed to create service: ' + err.message });
      }

      res.status(201).json({
        message: 'Service created successfully',
        service: {
          id: serviceId,
          name,
          category: category || '',
          description: description || null,
          icon: icon || null,
          color_theme: color_theme || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          phone_number: phone_number || null,
          email_address: email_address || null,
          website: website || null,
          logo_url: logo_url || null,
          banner_url: banner_url || null,
          cover_image_url: cover_image_url || null,
          estimated_wait_time: 10,
          is_fast_track_available: false,
          is_open: true,
          max_capacity: null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service creation' });
  }
};

exports.updateServiceInfo = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    description,
    icon,
    color_theme,
    address,
    lat,
    lng,
    phone_number,
    email_address,
    website,
    logo_url,
    banner_url,
    cover_image_url
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    const query = `
      UPDATE services SET 
        name = ?, category = ?, description = ?, icon = ?, 
        color_theme = ?, address = ?, lat = ?, lng = ?,
        phone_number = ?, email_address = ?, website = ?, logo_url = ?, banner_url = ?, cover_image_url = ?
      WHERE id = ?
    `;

    db.query(query, [
      name,
      category || '',
      description || null,
      icon || null,
      color_theme || null,
      address || null,
      lat || null,
      lng || null,
      phone_number || null,
      email_address || null,
      website || null,
      logo_url || null,
      banner_url || null,
      cover_image_url || null,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating service info:', err);
        return res.status(500).json({ error: 'Failed to update service info' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({
        message: 'Service info updated successfully',
        service: {
          id: id,
          name,
          category: category || '',
          description: description || null,
          icon: icon || null,
          color_theme: color_theme || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          phone_number: phone_number || null,
          email_address: email_address || null,
          website: website || null,
          logo_url: logo_url || null,
          banner_url: banner_url || null,
          cover_image_url: cover_image_url || null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service info update' });
  }
};

exports.updateServiceOperations = async (req, res) => {
  const { id } = req.params;
  const {
    estimated_wait_time,
    max_capacity,
    is_fast_track_available,
    is_open
  } = req.body;

  try {
    const query = `
      UPDATE services SET 
        estimated_wait_time = ?, max_capacity = ?, is_fast_track_available = ?, is_open = ?
      WHERE id = ?
    `;

    db.query(query, [
      estimated_wait_time || null,
      max_capacity || null,
      is_fast_track_available || false,
      is_open !== false,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating service operations:', err);
        return res.status(500).json({ error: 'Failed to update service operations' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({
        message: 'Service operations updated successfully'
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service update' });
  }
};

exports.getServiceSchedules = (req, res) => {
  db.query('SELECT * FROM service_schedules WHERE service_id = ? ORDER BY day_of_week ASC', [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

exports.updateServiceSchedules = (req, res) => {
  const { schedules } = req.body;
  const serviceId = req.params.id;

  db.query('DELETE FROM service_schedules WHERE service_id = ?', [serviceId], (err) => {
    if (err) {
      console.error('Error deleting old schedules:', err);
      return res.status(500).json({ error: 'Database error deleting old schedules' });
    }

    if (!schedules || schedules.length === 0) return res.json({ message: 'Schedules cleared' });

    const values = schedules.map(s => [
      serviceId, s.day_of_week, s.morning_open || null, s.morning_close || null,
      s.lunch_start || null, s.lunch_end || null, s.afternoon_open || null,
      s.afternoon_close || null, s.is_closed ? 1 : 0
    ]);

    db.query('INSERT INTO service_schedules (service_id, day_of_week, morning_open, morning_close, lunch_start, lunch_end, afternoon_open, afternoon_close, is_closed) VALUES ?', [values], (err) => {
      if (err) {
        console.error('Error inserting schedules:', err);
        return res.status(500).json({ error: 'Database error inserting schedules' });
      }
      res.json({ message: 'Schedules updated successfully' });
    });
  });
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    // First check if service has any tickets
    db.query('SELECT COUNT(*) as count FROM tickets WHERE service_id = ?', [id], (err, ticketResults) => {
      if (err) {
        console.error('Error checking service tickets:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (ticketResults[0].count > 0) {
        return res.status(400).json({
          error: 'Cannot delete service with existing tickets',
          message: 'Please resolve all tickets for this service before deleting'
        });
      }

      // Delete the service
      db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.error('Error deleting service:', err);
          return res.status(500).json({ error: 'Failed to delete service' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service deletion' });
  }
};
