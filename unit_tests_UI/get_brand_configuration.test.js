const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';
const token = ''//replace with valid token
chai.use(chaiHttp);
const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('Feature: Retrieving a brand configuration', function () {
  // Test case for when token is invalid
  // eslint-disable-next-line no-undef
  it('User receives an error if the token is invalid', function (done) {

    chai.request(app)
    .get('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(401);
        // expect(res.body).to.have.property('error').that.includes('Invalid');
        done();
      });
  });

  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a brand configuration', function (done) {
    chai
      .request(app)
      .get('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });

  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if data not found', function (done) {
    chai
    .request(app)
    .get('/branding/configuration')
    .auth(token, { type: 'bearer' })
    .end(function (err, res) {
      if (err) return done(err);
  
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('error');
      done();
    });
})

  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .get('/branding/configuration')
      .auth(token, { type: 'bearer' })
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
