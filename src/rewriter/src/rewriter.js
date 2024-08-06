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

export class Bte {
  constructor(blankHtmlPage) {
    // TODO провести сюда дефолтную страницу.
    // в случае пустой инициализации класса, сводить с дефолтной
    this.blankHtmlPage = blankHtmlPage;
  }

  async getPageHtml(svelteComponent, props) {
    // TODO если компонент не был проведен, то возвращать бланковую html страницу
    const renderResult = svelteComponent.render(props);

    this.head = renderResult.head;
    this.body = renderResult.html;
    this.css = renderResult.css.code;

    const rewriter = new HTMLRewriter()
      .on("html", new AppendHeadRewriter(this.head))
      .on("html", new AppendBodyRewriter(this.body))
      .on("html", new AppendCssRewriter(this.css));

    const pageHtml = rewriter.transform(this.blankHtmlPage);
    return pageHtml;
  }
}
