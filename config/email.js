const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Higher-order function for sending emails
const sendEmail = (emailType) => {
  return async (to, subject, data) => {
    try {
      let htmlContent = '';
      
      switch (emailType) {
        case 'registration':
          htmlContent = `
            <h2>Welcome to Burrrgerr! 🍔</h2>
            <p>Hi ${data.name},</p>
            <p>Thank you for registering with us. Get ready for the best burger experience!</p>
          `;
          break;
        case 'orderConfirmation':
          htmlContent = `
            <h2>Order Confirmed! 🎉</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your order #${data.orderId} has been confirmed.</p>
            <p>Total Amount: ₹${data.totalAmount}</p>
            <p>Estimated Delivery: ${data.estimatedDelivery}</p>
          `;
          break;
      }
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: htmlContent
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Email sending error:', error);
    }
  };
};

module.exports = {
  sendRegistrationEmail: sendEmail('registration'),
  sendOrderConfirmationEmail: sendEmail('orderConfirmation')
};