const Snarky = {
    performance: (func, args = [], runs = 1000) => {
        let result = 0;
        let params = [...args];

        var t0 = performance.now();
        for (var i = 0; i < runs; i++) {
            result = func(params);
        }
        var t1 = performance.now();

        return {time: (t1 - t0).toFixed(4), result: result};
    },
}
