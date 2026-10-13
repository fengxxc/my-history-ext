export default defineBackground(() => {
  console.log('My History background started.', { id: browser.runtime.id });
});
