const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: Retrieving a list of all fi requests', function () {
  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a list of all fi requests', function (done) {
    chai
      .request(app)
      .get('/fi/requests')
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });

//   it('Scenario: User Successfully retrieves fi requests based on filters', function (done) {
//     chai
//     .request(app)
//     .get('/fi/requests')
//     .query({ fiType:"SIP" }) 
//     .end(function (err, res) {
//       if (err) return done(err);
  
//       expect(res).to.have.status(200)
//       console.log(res.data)
//       done();
//     });
// })

// it('Scenario: filters should be in correct format', function (done) {
//   chai
//   .request(app)
//   .get('/fi/requests')
//   .query({ invalidFiType:"invalidFiType" }) 
//   .end(function (err, res) {
//     if (err) return done(err);

//     expect(res).to.have.status(400)
//     console.log(res.data)
//     done();
//   });
// })

  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .get('/fi/requests')
      .query({ id: 1}) 
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
