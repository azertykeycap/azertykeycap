import { Fragment, type JSX } from 'preact/jsx-runtime';

export const convertHexToRGBA = (hexCode: string, opacity = 1) => {
  const hex = hexCode.replace('#', '');

  const [r, g, b] = [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ];

  opacity = opacity > 1 ? opacity / 100 : opacity;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function parseStringWithNewlines(input: string): JSX.Element {
  const lines = input.split('\n');

  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line}
          {index !== lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
