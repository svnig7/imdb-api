import apiRequestRawHtml from "./apiRequestRawHtml";
import DomParser from "dom-parser";
import seriesFetcher from "./seriesFetcher";

export default async function getTitle(id) {
  const parser = new DomParser();
  const html = await apiRequestRawHtml(`https://www.imdb.com/title/${id}`);
  const dom = parser.parseFromString(html);
  const nextData = dom.getElementsByAttribute("id", "__NEXT_DATA__");
  const json = JSON.parse(nextData[0].textContent);

  const props = json.props.pageProps;

  const getCredits = (lookFor, v) => {
    const result = props.aboveTheFoldData.principalCredits.find(
      (e) => e?.category?.id === lookFor
    );

    return result
      ? result.credits.map((e) => {
          if (v === "2")
            return {
              id: e.name.id,
              name: e.name.nameText.text,
            };

          return e.name.nameText.text;
        })
      : [];
  };

  return {
    id: id,
    review_api_path: `/reviews/${id}`,
    imdb: `https://www.imdb.com/title/${id}`,
    contentType: props.aboveTheFoldData.titleType.id,
    contentRating: props.aboveTheFoldData?.certificate?.rating ?? "N/A",
    isSeries: props.aboveTheFoldData.titleType.isSeries,
    productionStatus:
      props.aboveTheFoldData.productionStatus.currentProductionStage.id,
    isReleased:
      props.aboveTheFoldData.productionStatus.currentProductionStage.id ===
      "released",
    title: props.aboveTheFoldData.titleText.text,
    image: props.aboveTheFoldData.primaryImage.url,
    images: props.mainColumnData.titleMainImages.edges
      .filter((e) => e.__typename === "ImageEdge")
      .map((e) => e.node.url),
    plot: props.aboveTheFoldData.plot.plotText.plainText,
    runtime:
      props.aboveTheFoldData.runtime?.displayableProperty?.value?.plainText ??
      "",
    runtimeSeconds: props.aboveTheFoldData.runtime?.seconds ?? 0,
    rating: {
      count: props.aboveTheFoldData.ratingsSummary?.voteCount ?? 0,
      star: props.aboveTheFoldData.ratingsSummary?.aggregateRating ?? 0,
    },
    genre: props.aboveTheFoldData.genres.genres.map((e) => e.id),
    releaseDetailed: {
      date: new Date(
        props.aboveTheFoldData.releaseDate.year,
        props.aboveTheFoldData.releaseDate.month - 1,
        props.aboveTheFoldData.releaseDate.day
      ).toISOString(),
      day: props.aboveTheFoldData.releaseDate.day,
      month: props.aboveTheFoldData.releaseDate.month,
      year: props.aboveTheFoldData.releaseDate.year,
    },
    year: props.aboveTheFoldData.releaseDate.year,
    ...(props.aboveTheFoldData.titleType.isSeries
      ? await seriesFetcher(id)
      : {}),
  };
}
