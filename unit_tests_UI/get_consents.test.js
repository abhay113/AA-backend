const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: Retrieving a list of all consents', function () {
  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a list of all consents', function (done) {
    chai
      .request(app)
      .get('/consents')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });
  // eslint-disable-next-line no-undef
  it('Scenario: User Successfully retrieves consensts based on filters', function (done) {
    chai
    .request(app)
    .get('/consents')
    .query({ fiType: 'SIP' }) 
    .end(function (err, res) {
      if (err) return done(err);
  
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('error');
      done();
    });
})

//   it('Scenario: User receives an error if the server encounters an issue', function (done) {

//     chai
//       .request(app)
//       .get('/consents')
//       .end(function (err, res) {
//         if (err) return done(err);

//         expect(res).to.have.status(500);
//         expect(res.body).to.have.property('error');
//         done();
//       });
//   });
});
