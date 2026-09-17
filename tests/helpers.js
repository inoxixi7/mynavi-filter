function createLink({ href, name, suffix = "" }) {
  return {
    childNodes: [{ textContent: name }],
    textContent: `${name}${suffix}`,
    getAttribute(attribute) {
      return attribute === "href" ? href : null;
    },
  };
}

function createCard({ href, name, suffix = "" }) {
  const link = href ? createLink({ href, name, suffix }) : null;

  return {
    querySelector(selector) {
      return selector === ".boxSearchresultEach_head h3 a" ? link : null;
    },
  };
}

function createCompanyDocument({ companyId, companyName, heading }) {
  return {
    querySelector(selector) {
      if (selector === 'input[name="corpId"]') {
        return companyId === undefined ? null : { value: companyId };
      }
      if (selector === 'input[name="corpName"]') {
        return companyName === undefined ? null : { value: companyName };
      }
      if (selector === "h1") {
        return heading === undefined ? null : { textContent: heading };
      }
      return null;
    },
  };
}

function createSearchDocument(cards) {
  return {
    querySelectorAll(selector) {
      return selector === ".boxSearchresultEach.corp" ? cards : [];
    },
  };
}

module.exports = {
  createCard,
  createCompanyDocument,
  createSearchDocument,
};
