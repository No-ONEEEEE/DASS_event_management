# Email Configuration Guide

This document explains how to set up email notifications for the Event Management System.

## Features

The system sends automated emails for:
- **Normal Events**: Ticket confirmation with QR code
- **Merchandise Events**: Purchase confirmation with order details and QR code

## Email Templates Included

### 1. Normal Event Ticket Email
- Event details (name, date, venue)
- Ticket ID with QR code
- Instructions for event attendance
- Link to view ticket online

### 2. Merchandise Order Confirmation Email
- Order details with item list
- Sizes and colors selected
- Total amount
- Payment status
- Collection instructions
- QR code for collection

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Turn on 2-Step Verification

2. **Generate App Password**
   - In Security settings, go to "App passwords"
   - Select "Mail" and your device
   - Google will generate a 16-character password
   - Copy this password

3. **Configure Environment Variables**
   Create or update `.env` file in the project root:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Option 2: Outlook/Hotmail (Easy Setup)

1. **Use Your Existing Outlook Account**
   - No special configuration needed
   - Works with @outlook.com, @hotmail.com, and @live.com addresses

2. **Configure Environment Variables**
   Create or update `.env` file in the project root:
   ```env
   EMAIL_SERVICE=outlook
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASS=your-outlook-password
   ```

   **Note:** 
   - Use your regular Outlook/Hotmail password (no app password needed)
   - Works with personal Microsoft accounts
   - For Office 365 business accounts, the same configuration works

### Option 3: Custom SMTP Server

```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

### Option 4: Production Email Services

For production, consider using professional email services:
- **SendGrid**: High deliverability, free tier available
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Easy API integration
- **Postmark**: Excellent for transactional emails

## Testing Email Functionality

### 1. Using a Test Email Service (Ethereal)

The system automatically falls back to Ethereal (fake SMTP) if no email configuration is provided. This is useful for testing without sending real emails.

### 2. Testing with Real Email

1. Configure your email credentials in `.env`
2. Register for an event
3. Check your email inbox
4. Verify the email contains:
   - Correct event details
   - Valid QR code image
   - Working "View Ticket Online" link

## Email Content

### Ticket Email Structure

```
Subject: 🎫 Your Ticket for [Event Name]

Hi [Participant Name],
Thank you for registering for [Event Name]!

Ticket ID: TKT-XXXXX
[QR Code Image]

Event Details:
- Event Name: ...
- Date & Time: ...
- Venue: ...

Important Instructions:
- Keep this email safe
- Present QR code at entrance
- Arrive 15 minutes early
- Don't share your ticket
```

### Merchandise Email Structure

```
Subject: 🛒 Order Confirmation: [Event Name]

Hi [Participant Name],
Your merchandise order has been confirmed!

Order Ticket ID: TKT-XXXXX
[QR Code Image]

Your Order:
- Item 1: T-Shirt x 2 (Size: L, Color: Blue)
- Item 2: Hoodie x 1 (Size: M)

Total Amount: ₹1500
Payment Status: Pending

Collection Instructions:
- Present QR code when collecting
- Complete payment before/during collection
- Verify all items before leaving
```

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_SERVICE
   ```

2. **Verify Gmail App Password**
   - Make sure it's the 16-character app password, not your regular password
   - Remove any spaces in the password

3. **Check Console Logs**
   - Look for "✅ Confirmation email sent to..."
   - Or "⚠️ Failed to send confirmation email..."

### Emails Going to Spam

- Use a verified domain email address
- Add SPF and DKIM records to your domain
- Use a professional email service (SendGrid, AWS SES)
- Avoid spam trigger words in subject/content

### Gmail Daily Limits

- Free Gmail accounts: 500 emails/day
- Google Workspace: 2000 emails/day
- For higher volume, use a professional service

## Security Best Practices

1. **Never commit .env file to Git**
   - Already in `.gitignore`
   - Only commit `.env.example`

2. **Use App Passwords for Gmail**
   - Never use your main password
   - App passwords are safer and can be revoked

3. **Rotate Credentials Regularly**
   - Change email passwords periodically
   - Revoke and regenerate app passwords

4. **Production Security**
   - Use environment variables on hosting platform
   - Enable TLS/SSL for SMTP
   - Monitor for unauthorized email sending

## Implementation Details

### Files Created/Modified

- `server/utils/emailService.js` - Email service with templates
- `server/routes/events.js` - Integrated email sending on registration
- `.env.example` - Email configuration template

### Email Service Functions

```javascript
// Send ticket email for normal events
sendTicketEmail(participantEmail, participantName, eventDetails, ticketData)

// Send merchandise confirmation
sendMerchandiseConfirmationEmail(participantEmail, participantName, eventDetails, ticketData, merchandiseItems, totalAmount)
```

### Error Handling

- Email failures don't prevent registration
- Errors are logged to console
- Users still receive confirmation on screen
- Tickets accessible via dashboard

## Customization

### Modifying Email Templates

Edit `server/utils/emailService.js`:
- Update HTML structure
- Change colors/styling
- Add custom branding
- Include additional information

### Adding More Email Types

Create new functions in `emailService.js`:
```javascript
const sendEventReminderEmail = async (participantEmail, eventDetails) => {
  // Implementation
};
```

## Support

If you encounter issues:
1. Check server console for error messages
2. Verify environment variables are set correctly
3. Test with a different email provider
4. Review email service documentation

## Notes

- QR codes are embedded as base64 images in emails
- Emails are sent asynchronously (don't block registration)
- Failed emails are logged but don't affect user experience
- All emails are HTML-formatted with fallback text
