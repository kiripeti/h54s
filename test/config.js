describe('h54s', function() {
  describe('init:', function() {

    it('should throw error if config data is missing or empty', function(done) {
      expect(function() {
        var sasAdapter = new h54s();
      }).not.to.throw(Error);
      expect(function() {
        var sasAdapter = new h54s({});
      }).not.to.throw(Error);
      done();
    });

    it('test config settings', function(done) {
      var sasAdapter;
      sasAdapter = new h54s({
        url: '/SASStoredProcess/someValue'
      });
      assert.equal('/SASStoredProcess/someValue', sasAdapter.url, 'Url is not set with config');
      sasAdapter = new h54s({
        url: '/someValue',
        hostUrl: serverData.url
      });
      assert.equal(serverData.url + 'someValue', sasAdapter.url, 'Full url is not correct');
      assert.isFalse(sasAdapter.debug, 'Debug option is not correct');
      sasAdapter = new h54s({
        debug: true
      });
      assert.isTrue(sasAdapter.debug, 'Debug option is not set');
      done();
    });

  });
});
