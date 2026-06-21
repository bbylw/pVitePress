import DefaultTheme from 'vitepress/theme'
import NavLinks from './components/NavLinks.vue'
import NavPage from './components/NavPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NavLinks', NavLinks)
    app.component('NavPage', NavPage)
  }
}
