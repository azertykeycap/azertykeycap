import { createClient, type Asset, type Entry } from "contentful";
import {
  createClient as createManagementClient,
  RichTextCommentDocument,
} from "contentful-management";
import { group } from "radash";
import type {
  TypeApiOgImagesSkeleton,
  TypeArticleSkeleton,
  TypeDropshippingWebsiteSkeleton,
  TypeHomepageSkeleton,
  TypeKeycaps__profileSkeleton,
} from "@/types/content-types";

import dynamicIconImports from "lucide-react/dynamicIconImports";

export interface InformationContentfulInterface {
  title: string;
  informationRichText: RichTextCommentDocument;
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

export type MaterialType =
  | "ABS Double-Shot"
  | "ABS Pad-Printed"
  | "ABS Simple"
  | "Aluminium"
  | "PBT Double-Shot"
  | "PBT Dye-Sub"
  | "PBT Laser printed";

export interface KeycapArticleContentfulInterface {
  readonly title: string;
  readonly img: string;
  readonly profile: { title: string; slug: string; abbreviation: string };
  readonly description?: string;
  readonly material: string;
  readonly status: StatusType;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly url: string;
  readonly additionalUrl?: string;
  readonly warningText?: string;
  readonly isNew?: boolean;
}

export interface DropshippingWebsiteInterface {
  title: string;
  img: string;
  url: string;
  examples: string | undefined;
  categories: string[] | undefined;
  description?: string;
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

export const contentfulManagementClient = createManagementClient(
  {
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || "",
  },
  {
    type: "plain",
    defaults: {
      environmentId: process.env.CONTENTFUL_ENVIRONMENT,
      spaceId: process.env.CONTENTFUL_SPACE_ID || "",
    },
  }
);

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

export const getProfileTitles = async (): Promise<string[]> => {
  const navigationLinksEntries =
    await contentfulClient.getEntries<TypeKeycaps__profileSkeleton>({
      content_type: "keycaps-profile",
      order: ["fields.title"],
    });

  return navigationLinksEntries.items.map(({ fields }) => {
    const { title } = fields;
    return title;
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
        )?.fields.slug === profile
    );

  if (articlesEntries.items.length > 0)
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
        img: (img as Asset)?.fields?.file?.url as string,
        slug,
        profile: {
          title: (
            profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
          )?.fields?.title,
          slug: (
            profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
          )?.fields?.slug,
          description: (
            profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
          )?.fields?.description,
          abbreviation: (
            profile as Entry<TypeKeycaps__profileSkeleton, undefined, string>
          )?.fields?.abbreviation,
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
  else return [];
};

export const getDropshippingSites = async () => {
  const dropshippingSitesEntries =
    await contentfulClient.getEntries<TypeDropshippingWebsiteSkeleton>({
      content_type: "dropshippingWebsite",
      limit: 300,
    });

  return dropshippingSitesEntries.items.map(({ fields }) => {
    const { title, banner, url, examples, categories, description } = fields;

    return {
      title,
      img: (banner as Asset)?.fields.file?.url as string,
      url,
      examples,
      categories,
      description,
    };
  });
};

export const getRandomOgApiImg = async () => {
  const ogApiEntries =
    await contentfulClient.getEntries<TypeApiOgImagesSkeleton>({
      content_type: "apiOgImages",
      limit: 20,
    });

  const randomApiOgEntry =
    ogApiEntries.items[Math.floor(Math.random() * ogApiEntries.items.length)];

  return (randomApiOgEntry.fields.img as Asset)?.fields.file?.url as string;
};
