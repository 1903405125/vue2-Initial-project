import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { Message, MessageBox, Table, TableColumn, Input, InputNumber, Button, ButtonGroup } from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.prototype.$message = Message
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(Button)
Vue.use(ButtonGroup)
// 导入公共样式表
import './assets/css/global.css'
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
