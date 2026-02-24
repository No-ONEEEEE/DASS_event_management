const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Skip email if no configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('ℹ️ Email not configured - emails will be skipped');
    return null;
  }
  
  // For development, use Gmail, Outlook, or a test service
  // For production, use a proper email service (SendGrid, AWS SES, etc.)
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password for Gmail
      }
    });
  }
  
  if (process.env.EMAIL_SERVICE === 'outlook' || process.env.EMAIL_SERVICE === 'hotmail') {
    return nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use your Outlook/Hotmail password
      }
    });
  }
  
  // Fallback to custom SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send ticket email for normal events
const sendTicketEmail = async (participantEmail, participantName, eventDetails, ticketData) => {
  try {
    const transporter = createTransporter();
    
    // Skip if email is not configured
    if (!transporter) {
      return { success: true, message: 'Email not configured - skipped' };
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .ticket-box { background: #f8f9fa; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          .ticket-id { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; letter-spacing: 2px; }
          .qr-code { margin: 20px 0; }
          .qr-code img { max-width: 250px; height: auto; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .instructions { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .instructions h3 { color: #856404; margin: 0 0 10px 0; font-size: 16px; }
          .instructions ul { margin: 10px 0 0 20px; color: #856404; }
          .instructions li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Event Ticket</h1>
            <p>Registration Confirmation</p>
          </div>
          
          <div class="content">
            <h2>Hi ${participantName},</h2>
            <p>Thank you for registering for <strong>${eventDetails.eventName}</strong>! Your registration has been confirmed.</p>
            
            <div class="ticket-box">
              <h3>Ticket ID</h3>
              <div class="ticket-id">${ticketData.ticketId}</div>
              
              ${ticketData.qrCode ? `
                <div class="qr-code">
                  <p><strong>QR Code for Entry</strong></p>
                  <img src="${ticketData.qrCode}" alt="Ticket QR Code" />
                  <p style="font-size: 12px; color: #666;">Please present this QR code at the event entrance</p>
                </div>
              ` : ''}
            </div>
            
            <div class="details">
              <h3>Event Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event Name:</span>
                <span class="detail-value">${eventDetails.eventName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${new Date(eventDetails.eventStartDate).toLocaleString()}</span>
              </div>
              ${eventDetails.venue ? `
                <div class="detail-row">
                  <span class="detail-label">Venue:</span>
                  <span class="detail-value">${eventDetails.venue}</span>
                </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Event Type:</span>
                <span class="detail-value">${eventDetails.eventType}</span>
              </div>
            </div>
            
            <div class="instructions">
              <h3>📋 Important Instructions</h3>
              <ul>
                <li>Keep this email safe until the event</li>
                <li>Present your QR code at the event entrance for attendance</li>
                <li>Arrive at least 15 minutes before the event starts</li>
                <li>Do not share your ticket ID or QR code with others</li>
              </ul>
            </div>
            
            <center>
              <a href="http://localhost:5000/ticket/${ticketData.registrationId}" class="button">View Ticket Online</a>
            </center>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions, please contact the event organizer.
            </p>
          </div>
          
          <div class="footer">
            <p>Event Management System</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"Event Management System" <${process.env.EMAIL_USER || 'noreply@eventmanagement.com'}>`,
      to: participantEmail,
      subject: `🎫 Your Ticket for ${eventDetails.eventName}`,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Ticket email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending ticket email:', error);
    return { success: false, error: error.message };
  }
};

// Send merchandise purchase confirmation email
const sendMerchandiseConfirmationEmail = async (participantEmail, participantName, eventDetails, ticketData, merchandiseItems, totalAmount) => {
  try {
    const transporter = createTransporter();
    
    // Skip if email is not configured
    if (!transporter) {
      return { success: true, message: 'Email not configured - skipped' };
    }
    
    // Generate merchandise items list HTML
    let merchandiseListHTML = '';
    if (merchandiseItems && merchandiseItems.length > 0) {
      merchandiseListHTML = merchandiseItems.map((item, index) => {
        let itemDetails = `${item.itemName || 'Item'} x ${item.quantity}`;
        if (item.selectedSize) itemDetails += ` (Size: ${item.selectedSize})`;
        if (item.selectedColor) itemDetails += ` (Color: ${item.selectedColor})`;
        
        return `
          <div class="detail-row">
            <span class="detail-label">Item ${index + 1}:</span>
            <span class="detail-value">${itemDetails}</span>
          </div>
        `;
      }).join('');
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .ticket-box { background: #f8f9fa; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          .ticket-id { font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0; letter-spacing: 2px; }
          .qr-code { margin: 20px 0; }
          .qr-code img { max-width: 250px; height: auto; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .total-row { background: #e7f9ed; font-size: 18px; font-weight: bold; padding: 15px; margin-top: 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .instructions { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .instructions h3 { color: #0c5460; margin: 0 0 10px 0; font-size: 16px; }
          .instructions ul { margin: 10px 0 0 20px; color: #0c5460; }
          .instructions li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Merchandise Order Confirmed</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="content">
            <h2>Hi ${participantName},</h2>
            <p>Your merchandise order for <strong>${eventDetails.eventName}</strong> has been confirmed!</p>
            
            <div class="ticket-box">
              <h3>Order Ticket ID</h3>
              <div class="ticket-id">${ticketData.ticketId}</div>
              
              ${ticketData.qrCode ? `
                <div class="qr-code">
                  <p><strong>QR Code for Collection</strong></p>
                  <img src="${ticketData.qrCode}" alt="Order QR Code" />
                  <p style="font-size: 12px; color: #666;">Present this QR code when collecting your merchandise</p>
                </div>
              ` : ''}
            </div>
            
            <div class="details">
              <h3>📦 Your Order</h3>
              ${merchandiseListHTML}
              
              <div class="detail-row total-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">₹${totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Status:</span>
                <span class="detail-value">Pending</span>
              </div>
            </div>
            
            <div class="details">
              <h3>Event Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span class="detail-value">${eventDetails.eventName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Collection Date:</span>
                <span class="detail-value">${new Date(eventDetails.eventStartDate).toLocaleString()}</span>
              </div>
              ${eventDetails.venue ? `
                <div class="detail-row">
                  <span class="detail-label">Collection Venue:</span>
                  <span class="detail-value">${eventDetails.venue}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="instructions">
              <h3>📋 Collection Instructions</h3>
              <ul>
                <li>Keep this email safe until collection</li>
                <li>Present your QR code when collecting your items</li>
                <li>Complete payment before or during collection</li>
                <li>Verify all items before leaving the collection point</li>
                <li>Do not share your order ticket or QR code</li>
              </ul>
            </div>
            
            <center>
              <a href="http://localhost:5000/ticket/${ticketData.registrationId}" class="button">View Order Details</a>
            </center>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions about your order, please contact the event organizer.
            </p>
          </div>
          
          <div class="footer">
            <p>Event Management System</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"Event Management System" <${process.env.EMAIL_USER || 'noreply@eventmanagement.com'}>`,
      to: participantEmail,
      subject: `🛒 Order Confirmation: ${eventDetails.eventName}`,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Merchandise confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending merchandise email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTicketEmail,
  sendMerchandiseConfirmationEmail
};
