const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1"; // Replace with your API URL

// eslint-disable-next-line no-undef
describe('POST /fi/notification API Tests', function() {
    this.timeout(30000);
// eslint-disable-next-line no-undef
    it('Scenario 1: Should successfully post FI notification with valid details', function()  {
        const validFiNotification = {
            "ver": "1.0",
            "timestamp": "2018-12-06T11:39:57.153Z",
            "txnid": "0b811819-9044-4856-b0ee-8c88035f8858",
            "Notifier": {
              "type": "AA",
              "id": "AA-1"
            },
            "FIStatusNotification": {
              "sessionId": "3c7bf7dd-85cf-4801-88d5-ea01543e50f7",
              "sessionStatus": "COMPLETED",
              "FIStatusResponse": [
                {
                  "fipID": "FIP-1",
                  "Accounts": [
                    {
                      "linkRefNumber": "XXXX-XXXX-XXXX",
                      "FIStatus": "READY",
                      "description": ""
                    }
                  ]
                }
              ]
            }
          }
        chai.request(api_url)
            .post('/fi/notification')
            .send(validFiNotification)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(200);
                // eslint-disable-next-line no-undef
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 2: Should return an error for invalid FI notification', function()  {
        const invalidFiNotification = {
        };

        chai.request(api_url)
            .post('/fi/notification')
            .send(invalidFiNotification)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                // Adjust the expected status code and response body as needed
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.equal('Bad request'); // Adjust the error message as needed
                // eslint-disable-next-line no-undef
                done();
            });
    });
});
