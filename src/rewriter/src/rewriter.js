class AppendHeadRewriter {
  constructor(appendContent) {
    this.appendContent = appendContent;
  }
  element(element) {
    // TODO замена заголовка, если он есть!
    element.append(this.appendContent, { html: true });
  }
}

class AppendBodyRewriter {
  constructor(appendContent) {
    this.appendContent = appendContent;
  }
  element(element) {
    element.append(this.appendContent, { html: true });
  }
}

class AppendCssRewriter {
  constructor(appendContent) {
    this.appendContent = appendContent;
  }
  element(element) {
    this.appendContent = `<style>${this.appendContent}</style>`;
    element.append(this.appendContent, { html: true });
  }
}

export class BtePageView {
  constructor(blankHtmlPage) {
    // TODO провести сюда дефолтную страницу.
    // в случае пустой инициализации класса, сводить с дефолтной
    this.blankHtmlPage = blankHtmlPage;

    // const renderResult = SvelteComponent.render(props);

    // this.componentBody = renderResult.html;
    // this.componentCss = renderResult.css.code;
    // this.componentHead = renderResult.head;
  }

  async getPageHtml(bteComponent, props) {
    // TODO если компонент не был проведен, то возвращать пустую html страницу

    const renderResult = bteComponent.render(props);
    Object.assign(this, renderResult);

    const rewriter = new HTMLRewriter()
      .on("html", new AppendHeadRewriter(this.head))
      .on("html", new AppendBodyRewriter(this.html))
      .on("html", new AppendCssRewriter(this.css));

    console.log(this.css);

    const pageHtml = rewriter.transform(this.blankHtmlPage);
    return pageHtml;
  }
}
