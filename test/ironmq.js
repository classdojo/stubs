var IronMQ = require("../lib/ironmq");
var expect = require("expect.js");
var _ = require("lodash");

var Client = IronMQ.Client;
var Queue = IronMQ.Queue;

describe("IronMQ Stub", function() {
  describe("Client", function() {

  });

  describe("Queue", function() {
    var format1 = "someMessage";
    var format2 = {body: "someMessage"};
    var format3 = {body: {some: "message"}};
    /*
      Message formats:

        -format 1: "someMessage"
        -format 2: {body: "someMessage"}
        -format 3: {body: {some: "message"}}
    */
    describe("#setMessages", function() {
      var queue;
      beforeEach(function(done) {
        queue = new Queue("test");
        done();
      });
      it("should throw an error when messages is not an array", function (done) {
        try {
          queue.setMessages();
        } catch(e) {
          return done();
        }
        done();
      });

      it("should allow an array of one message to be set in format 1", function(done) {
        queue.setMessages([format1]);
        expect(queue.messages).to.have.length(1);
        done();
      });

      it("should allow an array of one message to be set in format 2", function(done) {
        queue.setMessages([format2]);
        expect(queue.messages).to.have.length(1);
        done();
      });

      it("should allow an array of one message to be set in format 3", function(done) {
        queue.setMessages([format3]);
        expect(queue.messages).to.have.length(1);
        done();
      });

      it("should allow an array of three messages to be set in all formats", function(done) {
        queue.setMessages([format1, format2, format3]);
        expect(queue.messages).to.have.length(3);
        done();
      });
    });

    describe("#clear", function() {
      it("should reset messages", function(done) {
        var queue = new Queue("name");
        queue.setMessages(["message"]);
        queue.clear();
        expect(queue.messages).to.have.length(0);
        done();
      });
      it("should reset outstandingMessages", function(done) {
        var queue = new Queue("name");
        queue.setMessages(["message"]);
        queue.clear();
        expect(queue.outstandingMessages).to.have.length(0);
        done();
      });
    });

    describe("#get", function() {
      describe("returned messages for non empty queue", function() {
        var queue;
        beforeEach(function(done) {
          queue = new Queue("test");
          queue.setMessages(["someMessage1", "someMessage2", "someMessage3"]);
          done();
        });
        afterEach(function(done) {
          queue.clear();
          done();
        });
        it("should return one message when asking for one message", function(done) {
          queue.get({n: 1}, function(err, messages) {
            expect(err).to.be(null);
            expect(_.isObject(messages)).to.be(true);
            done();
          });
        });

        it("should return an array of three messages when asking for three messages", function(done) {
          queue.get({n: 3}, function(err, messages) {
            expect(err).to.be(null);
            expect(messages).to.have.length(3);
            done();
          });
        });

        it("should return an array of three messages when asking for > 3 messages when there are only three messages in the queue", function(done) {
          queue.get({n: 4}, function(err, messages) {
            expect(err).to.be(null);
            expect(messages).to.have.length(3);
            done();
          });
        });
      });

      describe("returned messages for empty queue", function() {
        var queue;
        beforeEach(function(done) {
          queue = new Queue("test");
          done();
        });
        afterEach(function(done) {
          queue.clear();
          done();
        });

        it("should return `undefined` if n == 1", function(done) {
          queue.get({n: 1}, function(err, message) {
            expect(err).to.be(null);
            expect(message).to.be(undefined);
            done();
          });
        });

        it("should return an empty Array if n > 1", function(done) {
          queue.get({n: 2}, function(err, messages) {
            expect(err).to.be(null);
            expect(messages).to.be.an(Array);
            expect(messages).to.have.length(0);
            done();
          });
        });
      });

      describe("release timeout", function() {
        var queue;
        var message;
        var timeout = 20;
        beforeEach(function(done) {
          queue = new Queue("test", timeout);
          queue.setMessages(["someMessage1"]);
          queue.get({n: 1}, function(err, m) {
            message = m;
            done(err);
          });
        });
        afterEach(function(done) {
          queue.clear();
          done();
        });
        it("should not return a message if another process is holding it", function(done) {
          queue.get({n: 1}, function(err, m) {
            expect(err).to.be(null);
            expect(m).to.be(undefined);
            done();
          });
        });
        it("should return a message if another process calls get after the release timeout", function(done) {
          setTimeout(function() {
            queue.get({n: 1}, function(err, m) {
              expect(err).to.be(null);
              expect(_.isObject(m)).to.be(true);
              done();
            });
          }, timeout * 2);
        });
      });
      describe("event loop timeout", function() {
        var queue;
        var interval;
        var timeout = 20;
        beforeEach(function(done) {
          queue = new Queue("test", timeout);
          queue.setMessages(["someMessage1"]);
          done();
        });
        afterEach(function(done) {
          queue.clear();
          clearInterval(interval);
          done();
        });
        it("should not error out when ticks cross multiple release time boundaries", function(done) {
          interval = setInterval(function() {
            queue.get({n: 1}, function(err, m) {
            });
          }, timeout / 2);
          setTimeout(function() {
            //just wait for multiple event boundaries to be crossed
            var jobs = queue.messages.concat(queue.outstandingMessages)
            expect(jobs).to.have.length(1);
            jobs.forEach(function(j) {
              expect(j).to.be.an(Object);
              expect(j).to.not.be.an(Array);
            });
            done();
          }, timeout * 10);
        });
      });
    });

    describe("#post", function() {
      var queue;
      beforeEach(function(done) {
        queue = new Queue("test");
        done();
      });
      it("should put a message on the queue in format1", function(done) {
        queue.post(format1, function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(1);
          done();
        });
      });
      it("should put a message on the queue in format2", function(done) {
        queue.post(format2, function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(1);
          done();
        });
      });
      it("should put a message on the queue in format3", function(done) {
        queue.post(format3, function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(1);
          done();
        });
      });
      it("should put all messages on the queue if in an array and a valid format", function(done) {
        queue.post([format1, format2, format3], function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(3);
          done();
        });
      });
    });

    describe("#del", function() {
      var queue;
      var message;
      var timeout = 20;
      beforeEach(function(done) {
        queue = new Queue("test", timeout);
        queue.setMessages(["someMessage1"]);
        queue.get({n: 1}, function(err, m) {
          message = m;
          done();
        });
      });
      afterEach(function(done) {
        queue.clear();
        done();
      });

      it("should delete this message if it's on the queue and released", function(done) {
        // var message = queue.messages[0];
        queue.del(message.id, function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(0);
          expect(queue.outstandingMessages).to.have.length(0);
          done();
        });
      });
      it("should delete the message after the release time", function(done) {
        setTimeout(function() {
          queue.del(message.id, function(err) {
            expect(err).to.be(null);
            expect(queue.messages).to.have.length(0);
            expect(queue.outstandingMessages).to.have.length(0);
            done();
          });
        }, timeout * 3);
      });
    });

    describe("#msg_release", function() {
      var queue;
      var message;
      var timeout = 20;
      beforeEach(function(done) {
        queue = new Queue("test", timeout);
        queue.setMessages(["someMessage1"]);
        queue.get({n: 1}, function(err, m) {
          message = m;
          done();
        });
      });
      afterEach(function(done) {
        queue.clear();
        done();
      });
      it("should set the outstanding message back on the queue", function(done) {
        queue.msg_release(message.id, {}, function(err) {
          expect(err).to.be(null);
          expect(queue.messages).to.have.length(1);
          expect(queue.outstandingMessages).to.have.length(0);
          done();
        });
      });
    });
  });
});






































