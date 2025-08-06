const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: Retrieving a list of all purposeCodes', function () {
  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a list of all purposeCodes', function (done) {
    chai
      .request(app)
      .get('/purposeCodes')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });
  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the request is not valid', function (done) {
    chai
    .request(app)
    .get('/purposeCodes')
    .query({ value: '1' }) 
    .end(function (err, res) {
      if (err) return done(err);
  
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
      done();
    });
})
  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .get('/purposeCodes')
      .path("/123")
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
