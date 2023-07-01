const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { SafeString } = require('handlebars');

const sequelize = require('./db/config');
const routes = require('./routes');

const PORT = process.env.PORT || 3001;

const app = express();
const hbs = exphbs.create({
  helpers: {
    renderStars: rating => {
      const stars = '&#11089;'.repeat(rating);
      return new SafeString(stars);
    },
    isCurrentUserItem: function (
      itemUserId,
      currentUserId,
      isAvailable,
      options
    ) {
      if (itemUserId === currentUserId) {
        return options.inverse(this);
      } else if (!isAvailable) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    trimString: function (passedString) {
      var theString = passedString.substring(0, 125);
      return new SafeString(theString);
    },
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize,
  }),
};

app.use(session(sessionConfig));

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);
const force = process.env.FORCE_SYNC === 'true';

sequelize.sync({ force }).then(() => {
  app.listen(PORT, () => {
    console.info(`Server listening on port ${PORT}`);
  });
});
