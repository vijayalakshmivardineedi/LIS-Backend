const jwt=require('jsonwebtoken');

exports.generateJwtToken = (_id, role) => {
    console.log(process.env.JWT_SECRET)
    return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };


exports.generateVerificationCode = function() {
    // Generate a random verification code here, e.g., a 6-digit number
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  };



exports.generateVerificationToken = (email) => {
  const crypto = require('crypto');
  const tokenLength = 40; 
  const tokenBytes = crypto.randomBytes(tokenLength / 2);
  const randomToken = tokenBytes.toString('hex');
  

  const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds


  const tokenWithExpiration = `${randomToken}:${expirationTime}:${email}`;

  return tokenWithExpiration;
};



exports.ScheduledDateTime = (req, res, next) => {
  req.scheduledDateTime = req.body.scheduledDateTime ? new Date(req.body.scheduledDateTime) : new Date();
  next();
};



exports.ScheduledDateTimeExat = (req, res, next) => {
  const requestedDateTime = req.body.appointmentDate ? new Date(req.body.appointmentDate) : null;

  if (requestedDateTime && requestedDateTime > new Date()) {

    req.scheduledDateTime = requestedDateTime;
  } else {

    req.scheduledDateTime = new Date();
  }

  next();
};
