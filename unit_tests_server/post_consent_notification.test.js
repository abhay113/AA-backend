const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1";
// eslint-disable-next-line no-undef
describe('POST /consent/notification API Tests', function() {
    this.timeout(30000);
// eslint-disable-next-line no-undef
    it('Scenario 1: Should return a 200 status code for valid details', function () {
        const validNotificationDetails = {
            "ver": "1.1.3",
            "timestamp": "2023-09-15T11:39:57.153Z",
             "Notifier": {
                "type": "AA",
                "id": "AA-1"
            },
            "ConsentStatusNotification": {
                "consentId": "eab430b5-9087-4e6f-8de2-26bf0ccd68bc",
                "consentHandle": "50aa95a8-f403-4ac1-a7ba-06c1ce767f54",
                "consentStatus": "READY"
            }
        }
        chai.request(api_url)
            .post('/consent/notification')
            .send(validNotificationDetails)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(200);
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 2: Should return a 400/404 status code for invalid details', function () {
        const invalidNotificationDetails = {
            "ver": "1.1.3",
            "timestamp": "2023-06-23T11:39:57.153Z",
            "txnid": "0b811819-9044-4856-b0ee-8c88035f8858",
            "Notifier": {
                "type": "AA",
                "id": "AA-1"
            },
            "ConsentStatusNotification": {
                "consentId": "051a295e-43d4-4b75-a109-3ac34a52a6b8",
                "consentHandle": "5b0dfe48-ee10-4685-897e-520e43b21962",
                "consentStatus": "REVOKED"
            }
        }
        chai.request(api_url)
            .post('/consent/notification')
            .send(invalidNotificationDetails)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(400); 
            });
    });
});
