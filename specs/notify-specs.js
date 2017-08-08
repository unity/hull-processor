const { expect } = require("chai");
const fs = require("fs");
const jwtDecode = require("jwt-decode");
const Minihull = require("minihull");

const bootstrap = require("./bootstrap");

describe("computing users", () => {
  let minihull;
  let server;

  const user = {
    id: "58b68d0f11111ef19e00df43",
    email: "thomas@hull.io",
    domain: "hull.io"
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    // setTimeout(() => {
      minihull.listen(8081).then(done);
      // minihull.install("http://localhost:8000").then(() => {
      //   done();
    //   // });
    // }, 100);
  });

  describe("using the /notify endpoint", () => {
    it("should send traits to the firehose", (done) => {
      const code = "hull.traits({ foo: \"bar\" })";
      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [{ user }]);
      minihull.on("incoming.request", (req) => console.log(req.method, req.url));
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql({ foo: "bar" });

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("user");
        expect(access_token.sub).to.equal(user.id);

        done();
      });
    });

    it("should send an account link to the firehose", (done) => {
      const code = "hull.account({ domain: user.domain });";
      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [{ user }]);

      // minihull.mimicUpdateConnector({ code });
      // minihull.mimicSendNotification("user_report:update", { user });
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql({});

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("account");
        expect(access_token["io.hull.asUser"]).to.eql({ id: user.id, email: user.email });
        expect(access_token["io.hull.asAccount"]).to.eql({ domain: user.domain });

        done();
      });
    });

    it("should send account traits to the firehose", (done) => {
      const code = "hull.account().traits({ name: \"Hull\"});";

      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [{ user }]);
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql({ name: "Hull" });

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("account");
        expect(access_token["io.hull.asUser"]).to.eql({ id: user.id, email: user.email });
        expect(access_token).to.not.have.property("io.hull.asAccount");

        done();
      });
    });
  });

  describe("regression tests on production code", () => {
    it("should have the same result than appcues production version", (done) => {
      const namespace = "appcues";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [message]);
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql(traits);

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("user");
        expect(access_token.sub).to.eql(message.user.id);
        expect(access_token).to.not.have.property("io.hull.asAccount");

        done();
      });
      return true;
    });

    it("should have the same result than lengow production version", (done) => {
      const namespace = "lengow";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [message]);
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql(traits);

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("user");
        expect(access_token.sub).to.eql(message.user.id);
        expect(access_token).to.not.have.property("io.hull.asAccount");

        done();
      });
      return true;
    });

    it("should have the same result than mention production version", (done) => {
      const namespace = "mention";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      const connector = {
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      };
      minihull.smartNotifyConnector(connector, "http://localhost:8000/notify", "user:update", [message]);
      minihull.on("incoming.request@/api/v1/firehose", (req) => {
        // traits
        const body = req.body.batch[0].body;
        expect(body).to.eql(traits);

        // claims
        const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
        expect(access_token["io.hull.subjectType"]).to.equal("user");
        expect(access_token.sub).to.eql(message.user.id);
        expect(access_token).to.not.have.property("io.hull.asAccount");

        done();
      });
      return true;
    });
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });
});


// notification object model
const message = {
  account: {
    id: "59367d6ff3829c7dfd000001",
    domain: "hull.io",
    name: "Hull",
    created_at: "2017-06-06T10:01:39Z",
    updated_at: "2017-06-15T13:48:57Z",
    "clearbit/foo": "bar"
  },
  account_segments: [],
  changes: {
    account: {},
    account_segments: [],
    is_new: false,
    segments: [],
    user: {
      last_seen_at: [
        "2017-06-16T10:24:34Z",
        "2017-06-16T10:29:30Z"
      ]
    }
  },
  events: [],
  segments: [
    {
      created_at: "2016-07-27T16:49:25Z",
      id: "5798e61503777df344000559",
      name: "Sync with Mailchimp",
      type: "users_segment",
      updated_at: "2017-04-28T10:21:07Z"
    },
    {
      created_at: "2016-02-03T10:47:07Z",
      id: "56b1daab5580c06798000051",
      name: "Recent users",
      type: "users_segment",
      updated_at: "2016-12-01T10:57:30Z"
    }
  ],
  user: {
    id: "58b68d0f11111ef19e00df43",
    email: "thomas@hull.io",
    first_name: "Thomas",
    last_name: "Kgaevski",
  }
};
