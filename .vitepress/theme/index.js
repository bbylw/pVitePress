import DefaultTheme from 'vitepress/theme'
import NavPage from './components/NavPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NavPage', NavPage)
  }
}
