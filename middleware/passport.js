let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../user')

module.exports = (app) => {
  let passport = app.passport

  passport.use(new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'username',
    failureFlash: true
  }, nodeifyit(async(username, password) => {
      let user
    if (username.indexOf('@')) {
        let email = username.toLowerCase()
        user = await User.promise.findOne({email})
      } else {
        let regexp = new RegExp(username, '1')
        //regex for case-insensitive query
        user = await User.promise.findOne({
          username: { $regex: regexp }
        })
      }

    if (!user || username !== user.username) {
      return [false, { message: 'Invalid username' }]
    }

    if (!await user.validatePassword(password)) {
    return [false, { message: 'Invalid password' }]
  }
  return user
}, { spread: true })))

passport.serializeUser(nodeifyit(async(user) => user._id))
passport.deserializeUser(nodeifyit(async(id) => {
  return await User.promise.findById(id)
}))

passport.use('local-signup', new LocalStrategy({
  // Use "email" field instead of "username"
  usernameField: 'email',
  failureFlash: true
}, nodeifyit(async(email, password) => {
    email = (email || '').toLowerCase()
      // Is the email taken?
      if (await User.promise.findOne({ email })) {
      return [false, { message: 'That email is already taken.' }]
    }

      // create the user
      let user = new User()
      user.email = email
      // Use a password hash instead of plain-text
      user.password = await user.generateHash(password)
      return await user.save()
  }, { spread: true })))
}
