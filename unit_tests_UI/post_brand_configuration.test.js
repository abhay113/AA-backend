const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';
let token = '';
chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: Retrieving a list of all configurations', function () {
   // Test case for when token is invalid
   // eslint-disable-next-line no-undef
   it('User receives an error if the token is invalid', function (done) {
    const payload = {}
    chai.request(app)
    .post('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .field('payload', payload)
      .attach('images', 'vd-fav.png', 'vd-fav.png')
      .type('form')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(401);
        // expect(res.body).to.have.property('error').that.includes('Invalid');
        done();
      });
  });
  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a list of all configurations', function (done) {
    const payload = {
        "BackgroundColorOne": "#db3333",
        "BackgroundColorTwo": "#b62b2b",
        "accentColor": "#24f057",
        "fontsFamily": "Arial",
        "navbarColor": "#5cc814",
        "primaryColor": "#cc0f0f",
        "textColor": "#060a07"
       }
    chai
      .request(app)
      .post('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .field('payload', payload)
      .attach('images', 'vd-fav.png', 'vd-fav.png')
      .type('form')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the request is not valid', function (done) {
    const payload = {}
    chai
    .request(app)
    .post('/branding/configuration')
    .auth(token, { type: 'bearer' })
    .field('payload', payload)
    .attach('files', 'vd-fav.png', 'vd-fav.png')
    .type('form')
    .end(function (err, res) {
      if (err) return done(err);
  
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
      done();
    });
})
// eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the server encounters an issue', function (done) {
    const payload = {}
    chai
      .request(app)
      .post('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .field('payload', payload)
      .attach('files', 'vd-fav.png', 'vd-fav.png')
      .type('form')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
