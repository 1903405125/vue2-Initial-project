let timers = {};

// 使用普通函数来处理消息事件
onmessage = function (e) {
    const { action, index, id, keyName } = e.data;
    console.log('🈲', action, index, id, keyName)
    // 创建定时器
    if (action === 'start') {
        if (!timers[id]) {
            timers[id] = setInterval(() => {
                postMessage({ action: 'ok', index, id, keyName });
            }, 1000);
        }
        // 清除定时器
    } else if (action === 'stop') {
        console.log('🧣', 'stop')
        clearInterval(timers[id]);
        delete timers[id];
        postMessage({ action: 'gg', index, id, keyName });
        // 清除所有定时器
    } else if (action === 'stopAll') {
        console.log('🥬', 'stopAll')
        Object.keys(timers).forEach(key => {
            clearInterval(timers[key]);
        });
        timers = {};
        postMessage({ action: 'gg_all', index, id, keyName });
        close(); // 关闭当前 Worker 线程
    }
};
