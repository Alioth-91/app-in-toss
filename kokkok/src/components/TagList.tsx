import { BADGE_COLOR } from "../types";
import type { Tag } from "../types";

type Props = {
  tags: Tag[];
  onSelect: (id: string) => void;
};

/**
 * 사진 아래 설명 목록. 번호는 사진 위 뱃지와 1:1로 대응합니다.
 *
 * 줄을 눌러도 설명 입력 시트가 열립니다. 사진 위 뱃지는 작고 손가락에 가려지는데
 * 이 줄은 넓어서 누르기 쉽습니다.
 */
export default function TagList({ tags, onSelect }: Props) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="tagList">
      {tags.map((tag, index) => (
        <li key={tag.id}>
          <button
            type="button"
            className="tagRow"
            onClick={() => onSelect(tag.id)}
          >
            <span className="rowBadge" style={{ background: BADGE_COLOR }}>
              {index + 1}
            </span>
            <span className={tag.label === "" ? "rowLabel empty" : "rowLabel"}>
              {tag.label === "" ? "설명을 입력해요" : tag.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
