import { Article } from "../../../components/Article";
import { articles } from "../../../content/articles";
import { pageMetadata } from "../../../lib/site";

const article = articles["import-format"];
export const metadata = pageMetadata(article.title, article.description, article.path);

export default function Page() {
  return <Article id="import-format" />;
}
