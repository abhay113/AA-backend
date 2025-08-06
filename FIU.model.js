const { Sequelize, DataTypes } = require('sequelize');
const sequelizeConfig = require('./config');
const sequelize = new Sequelize(sequelizeConfig.development);//postgres://postgres:admin@localhost:5430/fiu_middleware  //sqlite::memory:
const auth_sequelize = new Sequelize(sequelizeConfig.auth_server);


const FIP = sequelize.define('FIP', {
    fipID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    fip_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    handle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

const AGGREGATOR = sequelize.define('aggregator', {
    aggregator_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    public_key: {
        type: DataTypes.STRING,
        allowNull: true
    },
    handle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    base_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    webview_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    default_aggregator: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    displayHandle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    apps: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: false
});


const FIU_AGGREGATOR = sequelize.define('fiu_aggregator', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    public_key: {
        type: DataTypes.STRING,
        allowNull: true
    },
    handle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    base_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    webview_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    default_aggregator: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    displayHandle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    apps: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    realmName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

// 	CONSTRAINT consent_consentid_foreign FOREIGN KEY (consentId) REFERENCES public.consent_request(consentId)

const CONSENT = sequelize.define('consent', {
    consentHandle: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    signedConsent: {
        type: DataTypes.TEXT(2048),
        allowNull: true,
    },
    digitalSignature: {
        type: DataTypes.STRING(2048),
        allowNull: true,
    },
    accounts: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true
    },
    aggregator_id: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ConsentUse: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    txnid: {
        type: DataTypes.UUID,
        allowNull: true
    },
    correlation_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }

}, {
    freezeTableName: true,
    timestamps: false
});

const CUSTOMER_DETAIL = sequelize.define('customer_detail', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    customer_id: {
        type: DataTypes.STRING,
        // primaryKey: true,
        allowNull: false,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const CONSENT_MODE = sequelize.define('consent_mode', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    display: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

// 	CONSTRAINT consentrequest_aggregator_id_foreign FOREIGN KEY (aggregator_id) REFERENCES public.aggregator(aggregator_id),
// 	CONSTRAINT consentrequest_consenthandle_foreign FOREIGN KEY (consent_handle) REFERENCES public.consent_handle(consent_handle)

const CONSENT_REQUEST = sequelize.define('consent_request', {
    consent_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    txnid: {
        type: DataTypes.UUID,
        allowNull: false
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ConsentDetail: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    consentHandle: {
        type: DataTypes.UUID,
        unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    consentId: {
        type: DataTypes.UUID,
        unique: false,
    },
    // status: {
    //     type: DataTypes.JSON,
    //     allowNull: false,
    // },
    consentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

// 	CONSTRAINT consent_handle_aggregator_id_foreign FOREIGN KEY (aggregator_id) REFERENCE REFERENCES public.consent_request(consent_request_id),
// 	CONSTRAINT consenthandle_consenthandle_foreign FOREIGN KEY (consent_handle) REFERENCES public.consent(consent_handle)

const CONSENT_HANDLE = sequelize.define('consent_handle', {
    consentHandle: {
        type: DataTypes.UUID,
        unique: true,
        primaryKey: true,
        allowNull: false,
    },
    txnid: {
        type: DataTypes.UUID,
        allowNull: false
    },
    consentStatus: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consent_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const CONSENT_REQUEST_DETAIL = sequelize.define('consent_request_detail', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    consentStart: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    consentExpiry: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    consentMode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fetchType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    consentTypes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
    fiTypes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
    DataConsumer: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    Customer: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    Purpose: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    FIDataRange: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    DataLife: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    Frequency: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    DataFilter: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: false
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    consentId: {
        type: DataTypes.UUID,
        // allowNull: false,
        // unique: true,
    },
    consent_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    digitalSignature: {
        type: DataTypes.TEXT(2048),
        // allowNull: false,
    },
    consentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    consentHandle: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // count: {
    //     type: DataTypes.STRING,
    //     allowNull: false,
    // },
    frequency_limit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    correlation_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    firequest_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'PENDING'
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    product_id :{
        type: DataTypes.STRING,
        allowNull: false,
    },
    customer_ref :{
        type: DataTypes.STRING,
        allowNull: true,
        // unique: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const CONSENT_TYPE = sequelize.define('consent_type', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    display: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const DATA_CONSUMER = sequelize.define('data_consumer', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const DATA_LIFE = sequelize.define('data_life', {
    unit: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

// 	CONSTRAINT fi_request_fi_request_id_foreign FOREIGN KEY (fi_request_id) REFERENCES public."fi_sessionMgmt"(fi_request_id),
// 	CONSTRAINT "financial information_fi_request_id_foreign" FOREIGN KEY (fi_request_id) REFERENCES public.financial_information(fi_request_id)

const FI_REQUEST = sequelize.define('fi_request', {
    txnid: {
        type: DataTypes.UUID,
        allowNull: false
    },
    FIDataRange: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    Consent: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    consentHandle: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    FIRequest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    FIStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sessionStatus: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    FIStatusResponse: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    queueid : {
        type : DataTypes.STRING,
        allowNull:true,
    },
    comparison_status:{
        type : DataTypes.STRING,
        allowNull : true
    },
    customer_ref :{
        type: DataTypes.STRING,
        allowNull: true,
        // unique: true,
    },
    fetchType: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
});

// 	CONSTRAINT "fi_sessionMgmt_aggregator_id_foreign" FOREIGN KEY (aggregator_id) REFERENCES public.aggregator(aggregator_id),
// 	CONSTRAINT "fi_sessionMgmt_fi_status_fkey" FOREIGN KEY (fi_status) REFERENCES public.fi_status(fi_status)

const FI_SESSIONMGMNT = sequelize.define('fi_sessionMgmt', {
    sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: false,
        // unique: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
        // unique: false,
    },
    txnid: {
        type: DataTypes.UUID,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    FIRequest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    FIStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sessionStatus: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    FIStatusResponse: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const FI_STATUS = sequelize.define('fi_status', {
    fi_status: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const FI_TYPE = sequelize.define('fi_type', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    display: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});


const FINANCIAL_INFORMATION = sequelize.define('financial_information', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    txnid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    FI: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    FIRequest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
    },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

const FIPData = sequelize.define('fip_data', {
    fipID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false,
});

const FinancialData = sequelize.define('financial_data', {
    linkRefNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    maskedAccNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    encryptedFI: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    decryptedFI: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false,
});

FINANCIAL_INFORMATION.hasMany(FIPData, {
    foreignKey: {
        allowNull: false,
    },
});
FIPData.belongsTo(FINANCIAL_INFORMATION);

FIPData.hasMany(FinancialData, {
    foreignKey: {
        allowNull: false,
    },
});
FinancialData.belongsTo(FIPData);

const INVOCATION = sequelize.define('invocation', {
    txnid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    request: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    response: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const KEY_PAIR_DETAIL = sequelize.define('key_pair_detail', {
    FIRequest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    fipPublicKey: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fipRandom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fiuPrivateKey: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fiuPublicKey: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fiuRandom: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const NOTIFICATION = sequelize.define('notification', {
    txnid: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    notification_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    notificationType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // notification_detail: {
    //     type: DataTypes.JSON,
    //     allowNull: false,
    // },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    consentHandle: {
        type: DataTypes.UUID,
        unique: false,
        allowNull: true,
    },
    consentId: {
        type: DataTypes.UUID,
        allowNull: true,
        // unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Notifier: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    ConsentStatusNotification: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    FIStatusNotification: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const PURPOSE_CODE = sequelize.define('purpose_code', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    display: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

const OPERATORS = sequelize.define('operators', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    display: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

const PRODUCT = sequelize.define('product', {
    product_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    productDetail: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const CONSENT_REQUEST_REPLICA = sequelize.define('consent_request_replica', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    consent_start: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    consent_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    consent_mode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fetch_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consent_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    fi_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    data_consumer: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    customer: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    purpose: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    fi_data_range: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    data_life: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    frequency: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    data_filter: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consent_id: {
        type: DataTypes.UUID,
        // allowNull: false,
        // unique: true,
    },
    consent_request_id: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    digital_signature: {
        type: DataTypes.TEXT(2048),
        // allowNull: false,
    },
    consent_status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consent_handle: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    frequency_limit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    session_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    firequest_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'PENDING'
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customer_ref :{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const FI_REQUEST_REPLICA = sequelize.define('fi_request_replica', {
    txnid: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    fi_data_range_from: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    fi_data_range_to: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    consent: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    session_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    consent_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    consent_handle: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    fi_request_id: {
        type: DataTypes.UUID,
        allowNull: true,
        primaryKey: true,
    },
    aggregator_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fi_status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    session_status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fi_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    fi_status_response: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bsa_reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    bsa_report_link: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bsa_report_status: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    no_of_accounts: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fetchType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer_ref :{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const CONFIGURATION = sequelize.define('configuration', {
    config_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    branding_config: {
        type: DataTypes.JSON,
        allowNull: true
    },
    fi_request: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const AUTHORIZATION = sequelize.define('authorization', {
    correlation_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    client_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    grant_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    product_id: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const POLICY = sequelize.define('policy', {
    category_name: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    component: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const MAIL_CONFIGURATION = sequelize.define('mail_configuration', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const REALM_CONFIG = sequelize.define('realm_config', {
    realm: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true,
    },
    web_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    successRedirectURL: {
        type: DataTypes.STRING,
        allowNull: true
    },
    failureRedirectURL: {
        type: DataTypes.STRING,
        allowNull: true
    },
    webhook_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    organizationName :{
        type: DataTypes.STRING,
        allowNull: true
    },
    fiuBaseURL :{
        type: DataTypes.STRING,
        allowNull: true 
    },
    logopath :{
        type :DataTypes.STRING,
        allowNull : true
    },
    header :{
        type :DataTypes.STRING,
        allowNull : true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const ROLE_MAPPING = sequelize.define('role_mapping', {
    category_name: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    component: {
        type: DataTypes.JSON,
        allowNull: true
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: false
})

const ROLES = sequelize.define('roles', {
    role_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    role_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role_description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role_policies: {
        type: DataTypes.JSON,
        allowNull: true
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    groups: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: []
    },
}, {
    freezeTableName: true,
    timestamps: false
})

const ENTITY_CONFIGURATION = sequelize.define('entity_configuration', {
    template_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true
    },
    sender_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bsa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sms_avail: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const SCHEDULER = sequelize.define('schedule', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true
    },
    cronExpression: {
        type: DataTypes.STRING,
        allowNull: true
    },
    consentHandle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comparisonKey: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comparisonValue: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comparisonExpression: {
        type: DataTypes.STRING,
        allowNull: true
    },
    queueName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    scheduleTime: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

const LOGIN_CONFIG = sequelize.define('login_config', {
    client_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    kc_clientId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    kc_clientSecret: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
})

/* AUTH TABLE */
const SESSIONMGMNT = sequelize.define('sessionMgmt', {
    sessionid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    correlationId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    validTill: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    redirectURL: {
        type: DataTypes.TEXT(2048),
        allowNull: false,
    },
    successRedirectURL: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    failureRedirectURL: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sessionStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false
});

const KC_CONFIG = sequelize.define('kc_config', {
    realm: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    client_id: {
        type: DataTypes.STRING,
    },
    config: {
        type: DataTypes.JSON,
        allowNull: true
    },
    web_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
});


const FI_DATA = sequelize.define('fi_data', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fi_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ver: {
        type: DataTypes.STRING,
        allowNull: true
    },
    consent_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
});

const BULK_FIREQUEST = sequelize.define('bulk_fiRequest', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    req_body: {
        type: DataTypes.JSON,
    },
    realm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true
    },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    freezeTableName: true,
    timestamps: false
});

/* END AUTH TABLE*/

// ----------- CONSENT CONSTRAINTS
CONSENT.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });

// ----------- CUSTOMER_DETAIL CONSTRAINTS
CUSTOMER_DETAIL.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });

// ----------- CONSENT_REQUEST CONSTRAINTS
CONSENT_REQUEST.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });
CONSENT_REQUEST.belongsTo(CONSENT_HANDLE, { foreignKey: 'consentHandle' });

// ----------- CONSENT_HANDLE CONSTRAINTS
CONSENT_HANDLE.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });
CONSENT_HANDLE.belongsTo(CONSENT_REQUEST, { foreignKey: 'consent_request_id' });

// ----------- CONSENT_REQUEST_DETAIL CONSTRAINTS
CONSENT_REQUEST_DETAIL.belongsTo(CONSENT_REQUEST, { foreignKey: 'consent_request_id' });

// ----------- FI_REQUEST CONSTRAINTS
FI_REQUEST.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });
FI_REQUEST.belongsTo(CONSENT, { foreignKey: 'consentHandle' });

// ----------- FI_SESSIONMGMNT CONSTRAINTS
FI_SESSIONMGMNT.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });
FI_SESSIONMGMNT.belongsTo(FI_STATUS, { foreignKey: 'FIStatus' });

// ----------- FINANCIAL_INFORMATION CONSTRAINTS
FINANCIAL_INFORMATION.belongsTo(FIP, { foreignKey: 'fipID' });

// ----------- KEY_PAIR_DETAIL CONSTRAINTS
KEY_PAIR_DETAIL.belongsTo(FI_REQUEST, { foreignKey: 'FIRequest_id' });
KEY_PAIR_DETAIL.belongsTo(FI_SESSIONMGMNT, { foreignKey: 'sessionId' });

// ----------- NOTIFICATION CONSTRAINTS
NOTIFICATION.belongsTo(AGGREGATOR, { foreignKey: 'aggregator_id' });
NOTIFICATION.belongsTo(FI_SESSIONMGMNT, { foreignKey: 'sessionId' });
NOTIFICATION.belongsTo(CONSENT, { foreignKey: 'consentHandle' });

// CONSENT_REQUEST_REPLICA.hasOne(FI_REQUEST_REPLICA, {foreignKey: 'correlation_id',sourceKey:'correlation_id'});
// FI_REQUEST_REPLICA.belongsTo(CONSENT_REQUEST_REPLICA, {foreignKey: 'correlation_id',targetKey:'correlation_id'});

// sequelize.sync() //{ force: true } { alter: true } 
//     .then(() => {
//         console.log('Models synced successfully');
//     })
//     .catch((error) => {
//         console.error('Error syncing models:', error);
//     });

(async () => {
    try {
        await sequelize.authenticate().then(async () => {
            console.log('Database connection has been established successfully.');
            // eslint-disable-next-line no-undef
            sequelize.createSchema(process.env.SCHEMA_NAME);
            await sequelize.sync() //{ force: true } { alter: true } 
                .then(() => {
                    console.log('Models synced successfully');
                })
                .catch((error) => {
                    console.error('Error syncing models:', error);
                });
        });

        await auth_sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        auth_sequelize.sync() //{ force: true } { alter: true } 
            .then(() => {
                console.log('Models synced successfully');
                // eslint-disable-next-line no-undef
                auth_sequelize.createSchema(process.env.SCHEMA_NAME);
            })
            .catch((error) => {
                console.error('Error syncing models:', error);
            });

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();
module.exports = {
    FIP,
    AGGREGATOR,
    CONSENT,
    CONSENT_HANDLE,
    CONSENT_MODE,
    CONSENT_REQUEST,
    CONSENT_REQUEST_DETAIL,
    CONSENT_TYPE,
    CUSTOMER_DETAIL,
    DATA_CONSUMER,
    DATA_LIFE,
    FI_REQUEST,
    FI_SESSIONMGMNT,
    FI_STATUS,
    FI_TYPE,
    FINANCIAL_INFORMATION,
    INVOCATION,
    KEY_PAIR_DETAIL,
    NOTIFICATION,
    PURPOSE_CODE,
    OPERATORS,
    PRODUCT,
    CONSENT_REQUEST_REPLICA,
    FI_REQUEST_REPLICA,
    CONFIGURATION,
    AUTHORIZATION,
    POLICY,
    MAIL_CONFIGURATION,
    REALM_CONFIG,
    ROLE_MAPPING,
    ROLES,
    ENTITY_CONFIGURATION,
    SCHEDULER,
    LOGIN_CONFIG,
    SESSIONMGMNT,
    KC_CONFIG,
    FIU_AGGREGATOR,
    FI_DATA,
    BULK_FIREQUEST
}