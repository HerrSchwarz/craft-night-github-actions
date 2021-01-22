describe('example', function() {
    it('should execute a test', function() {
        expect(true).toBe(true)
    })
    it('should find the secret', function() {
        expect(process.env.TEST_SECRET).toBe("foo")
    })
})
