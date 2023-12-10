import { createClient, type Asset, type Entry } from "contentful";
import { group } from "radash";

import type { Document } from "@contentful/rich-text-types";
import type {
  TypeArticleSkeleton,
  TypeHomepageSkeleton,
  TypeKeycaps__profileSkeleton,
} from "@/types/content-types";
import dynamicIconImports from "lucide-react/dynamicIconImports";

export interface InformationContentfulInterface {
  title: string;
  informationRichText: Document;
}

export interface NavigationLinksInterface {
  title: string;
  slug: string;
  abbreviation: string;
  shape: "Uniforme" | "Sculpté";
  description?: string;
  navbarDescription: string;
  navbarIconName?: string;
}

export type ShapedNavigationLinksInterface = Record<
  string,
  NavigationLinksInterface[]
>;

export type homePageContentType = {
  [key: string]: KeycapArticleContentfulInterface[];
};

export interface SocialNetworkContentfulInterface {
  fields: { title: string; url: string; iconText: string };
  contentTypeId: string;
}

interface SocialIconInterface {
  title: string;
  url: string;
  iconText: keyof typeof dynamicIconImports;
}

export interface ProfileContentfulInterface {
  readonly title: string;
  readonly slug: string;
  readonly abbreviation: string;
  readonly description?: string;
  readonly thumbnail?: string;
  readonly navbarDescription: string;
  readonly navbarIconName?: string;
}

export type StatusType =
  | "En stock"
  | "Extras GB"
  | "Extras In-Stock"
  | "GB en cours"
  | "GB terminé"
  | "Interest Check"
  | "Out Of Stock";

export interface KeycapArticleContentfulInterface {
  readonly title: string;
  readonly img: string;
  readonly profile: { title: string; slug: string; abbreviation: string };
  readonly description?: string;
  readonly material: string;
  readonly status?: StatusType;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly url: string;
  readonly additionalUrl?: string;
  readonly warningText?: string;
  readonly isNew?: boolean;
}

export type KeycapArticleType = Omit<
  KeycapArticleContentfulInterface,
  "img" | "profile" | "startDate" | "endDate"
> & {
  img: string;
  profile: { title: string; slug: string };
  profileId: string;
  startDate?: string;
  endDate?: string;
};

export const contentfulClient = createClient({
  environment: process.env.CONTENTFUL_ENVIRONMENT,
  space: process.env.CONTENTFUL_SPACE_ID || "",
  accessToken:
    (process.env.DEV
      ? process.env.CONTENTFUL_PREVIEW_TOKEN
      : process.env.CONTENTFUL_DELIVERY_TOKEN) || "",
  host: process.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});

export const getNavigationLinks =
  async (): Promise<ShapedNavigationLinksInterface> => {
    const navigationLinksEntries =
      await contentfulClient.getEntries<TypeKeycaps__profileSkeleton>({
        content_type: "keycaps-profile",
        order: ["fields.title"],
      });

    const links = navigationLinksEntries.items.map(({ fields }) => {
      const {
        title,
        slug,
        abbreviation,
        description,
        shape,
        navbarDescription,
        navbarIconName,
      } = fields;
      return {
        title,
        slug,
        abbreviation,
        description,
        shape,
        navbarDescription,
        navbarIconName,
      };
    });

    return group(links, (l) => l.shape);
  };

export const getProfileSlugs = async (): Promise<string[]> => {
  const navigationLinksEntries =
    await contentfulClient.getEntries<TypeKeycaps__profileSkeleton>({
      content_type: "keycaps-profile",
      order: ["fields.title"],
    });

  return navigationLinksEntries.items.map(({ fields }) => {
    const { slug } = fields;
    return slug;
  });
};

export const getHomePageInformation = async () => {
  const { items } = await contentfulClient.getEntries<TypeHomepageSkeleton>({
    content_type: "homepage",
    limit: 1,
  });

  const homePageContent: {
    title: string;
    description: string;
    profileCards: Array<ProfileContentfulInterface>;
  } = {
    title: items[0].fields.title,
    description: items[0].fields.description,
    profileCards: items[0].fields.profileCards.map(({ fields }: any) => ({
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      abbreviation: fields.abbreviation,
      thumbnail: fields.thumbnail?.fields.file.url,
      navbarDescription: fields.navbarDescription,
      navbarIconName: fields.navbarIconName,
    })),
  };

  return homePageContent;
};

export const getSocialLinksEntries = async () => {
  const entries =
    await contentfulClient.getEntries<SocialNetworkContentfulInterface>({
      content_type: "socialNetwork",
    });

  const socialLinks: Array<SocialIconInterface> = entries.items.map((n) => {
    const { title, url, iconText } = n.fields;
    return { title, url, iconText };
  });

  return socialLinks;
};

export const getArticles = async (profile?: string) => {
  const articlesEntries =
    await contentfulClient.getEntries<TypeArticleSkeleton>({
      content_type: "article",
      limit: 300,
    });

  if (profile)
    articlesEntries.items = articlesEntries.items.filter(
      ({ fields }) =>
        (
          fields.profile as Entry<
            TypeKeycaps__profileSkeleton,
            undefined,
            string
          >
        ).fields.slug === profile
    );

  return articlesEntries.items.map(({ fields }) => {
    const {
      title,
      img,
      slug,
      profile,
      material,
      description,
      status,
      startDate,
      endDate,
      url,
      additionalUrl,
      warningText,
      isNew,
    } = fields;

    return {
      title,
      img: (img as Asset).fields.file?.url as string,
      slug,
      profile: {
        title: (
          profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
        ).fields?.title,
        slug: (
          profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
        ).fields?.slug,
        description: (
          profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
        ).fields?.description,
        abbreviation: (
          profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
        ).fields?.abbreviation,
      },
      material,
      description,
      status,
      startDate: startDate
        ? new Date(startDate).toLocaleDateString("fr-FR")
        : undefined,
      endDate: endDate
        ? new Date(endDate).toLocaleDateString("fr-FR")
        : undefined,
      url,
      additionalUrl,
      warningText,
      isNew,
    };
  });
};
