import { Article } from "../../../components/Article";
import { articles } from "../../../content/articles";
import { pageMetadata } from "../../../lib/site";

const article = articles["menu-or-disclosure"];
export const metadata = pageMetadata(article.title, article.description, article.path);

export default function Page() {
  return <Article id="menu-or-disclosure" />;
}
